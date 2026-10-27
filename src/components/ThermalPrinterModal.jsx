import React, { useState, useEffect } from 'react';
import {
  Printer,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Play,
  RotateCcw,
  Sliders,
  Scissors,
  DollarSign,
  FileText,
  Trash2,
  HelpCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import {
  getPrinterStatus,
  getPrintersList,
  printTestReceipt,
  updatePrinterSettings,
  getPrintJobs,
  retryPrintJob,
  clearPrinterQueue
} from '../lib/printerService';

export default function ThermalPrinterModal({ isOpen, onClose, isLight = false, lang = 'de', onToast }) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [printers, setPrinters] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [showHelp, setShowHelp] = useState(false);

  // Form Config
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [paperWidth, setPaperWidth] = useState(80);
  const [cutPaper, setCutPaper] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [copies, setCopies] = useState(1);

  // Load Status, Printers, and Jobs
  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, printersRes, jobsRes] = await Promise.all([
        getPrinterStatus(),
        getPrintersList(),
        getPrintJobs(15)
      ]);

      setStatus(statusRes);
      setPrinters(printersRes);
      setJobs(jobsRes);

      if (statusRes && statusRes.config) {
        setAutoPrint(statusRes.config.autoPrint !== false);
        setPaperWidth(statusRes.config.paperWidth || 80);
        setCutPaper(statusRes.config.cutPaper !== false);
        setOpenDrawer(!!statusRes.config.openDrawer);
        setCopies(statusRes.config.copies || 1);
      }

      if (statusRes?.activePrinterName) {
        setSelectedPrinter(statusRes.activePrinterName);
      } else if (printersRes.length > 0) {
        const found = printersRes.find(p => /ZJ|8330|POS|Thermal|Generic/i.test(p.name));
        if (found) setSelectedPrinter(found.name);
      }
    } catch (err) {
      console.warn('Error loading printer modal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Save Config
  const handleSaveConfig = async (overrideValues = {}) => {
    setActionLoading(true);
    try {
      const payload = {
        printerName: overrideValues.printerName !== undefined ? overrideValues.printerName : selectedPrinter,
        autoPrint: overrideValues.autoPrint !== undefined ? overrideValues.autoPrint : autoPrint,
        paperWidth: overrideValues.paperWidth !== undefined ? overrideValues.paperWidth : paperWidth,
        cutPaper: overrideValues.cutPaper !== undefined ? overrideValues.cutPaper : cutPaper,
        openDrawer: overrideValues.openDrawer !== undefined ? overrideValues.openDrawer : openDrawer,
        copies: overrideValues.copies !== undefined ? overrideValues.copies : copies
      };

      const res = await updatePrinterSettings(payload);
      if (res && res.success) {
        if (onToast) onToast(lang === 'de' ? 'Drucker-Einstellungen gespeichert!' : 'Printer settings saved!', 'success');
        await loadData();
      }
    } catch (err) {
      if (onToast) onToast(`Fehler: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Toggle Auto Print
  const handleToggleAutoPrint = async () => {
    const nextVal = !autoPrint;
    setAutoPrint(nextVal);
    await handleSaveConfig({ autoPrint: nextVal });
  };

  // Handle Send Test Print
  const handleTestPrint = async () => {
    setActionLoading(true);
    try {
      const res = await printTestReceipt(selectedPrinter);
      if (res && res.success) {
        if (onToast) onToast(lang === 'de' ? '✓ Testdruck an Drucker gesendet!' : '✓ Test receipt sent to printer!', 'success');
        await loadData();
      } else {
        throw new Error(res?.error || 'Testdruck fehlgeschlagen');
      }
    } catch (err) {
      if (onToast) onToast(`Testdruck fehlgeschlagen: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Retry Job
  const handleRetry = async (jobId) => {
    setActionLoading(true);
    try {
      const res = await retryPrintJob(jobId);
      if (res && res.success) {
        if (onToast) onToast(lang === 'de' ? '✓ Auftrag erneut gedruckt!' : '✓ Job reprinted!', 'success');
        await loadData();
      } else {
        throw new Error(res?.error || 'Fehler beim erneuten Drucken');
      }
    } catch (err) {
      if (onToast) onToast(`Wiederholen fehlgeschlagen: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Clear Stuck Jobs
  const handleClearJobs = async () => {
    if (!window.confirm(lang === 'de' ? 'Druckerschlange wirklich leeren?' : 'Clear all queued jobs?')) return;
    setActionLoading(true);
    try {
      await clearPrinterQueue(selectedPrinter);
      if (onToast) onToast(lang === 'de' ? 'Druckerwarteschlange bereinigt!' : 'Print queue cleared!', 'info');
      await loadData();
    } catch (err) {
      if (onToast) onToast(`Fehler: ${err.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isConnected = !!status?.serviceOnline && !!status?.isPrinterFound;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: isLight ? '#ffffff' : '#131b2e',
          color: isLight ? '#0f172a' : '#f8fafc',
          border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight ? '#f8fafc' : '#0f172a'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isConnected ? '#10b981' : '#e11d48',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Printer size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                {lang === 'de' ? 'Thermischer Bon-Drucker' : 'Thermal Receipt Printer'}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                Zjiang ZJ-8330-L • 80mm USB Bon-Drucker • Automatische Küchenbons
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadData}
              disabled={loading}
              title={lang === 'de' ? 'Aktualisieren' : 'Refresh'}
              style={{
                background: isLight ? '#ffffff' : '#1e293b',
                color: isLight ? '#0f172a' : '#cbd5e1',
                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>

            <button
              onClick={onClose}
              style={{
                background: isLight ? '#ffffff' : '#1e293b',
                color: isLight ? '#0f172a' : '#cbd5e1',
                border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Banner */}
          <div
            style={{
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: isConnected
                ? (isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)')
                : (isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.12)'),
              border: `1.5px solid ${isConnected ? (isLight ? '#86efac' : 'rgba(16, 185, 129, 0.4)') : (isLight ? '#fecaca' : 'rgba(239, 68, 68, 0.4)')}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isConnected ? '#10b981' : '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isConnected ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14.5px', color: isConnected ? (isLight ? '#166534' : '#4ade80') : (isLight ? '#991b1b' : '#f87171') }}>
                  {isConnected
                    ? (lang === 'de' ? 'Drucker bereit & verbunden' : 'Printer Ready & Connected')
                    : (lang === 'de' ? 'Drucker getrennt oder Dienst offline' : 'Printer Disconnected / Service Offline')}
                </div>
                <div style={{ fontSize: '12px', color: isLight ? '#475569' : '#94a3b8', marginTop: '2px' }}>
                  {status?.activePrinterName ? `Aktiver Drucker: ${status.activePrinterName}` : 'Kein Drucker ausgewählt'}
                  {status?.printerDetail?.port && ` • Port: ${status.printerDetail.port}`}
                  {status?.printerDetail?.jobCount !== undefined && ` • Warteschlange: ${status.printerDetail.jobCount} Auftrag/Aufträge`}
                </div>
              </div>
            </div>

            <button
              onClick={handleTestPrint}
              disabled={actionLoading}
              style={{
                background: '#e11d48',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)'
              }}
            >
              <Play size={14} />
              <span>{lang === 'de' ? 'Testdruck' : 'Test Print'}</span>
            </button>
          </div>

          {/* Auto Print Primary Switch */}
          <div
            style={{
              background: isLight ? '#f8fafc' : '#0f172a',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff' }}>
                {lang === 'de' ? '⚡ Automatischer Sofort-Druck bei jeder neuen Bestellung' : '⚡ Instant Auto-Print on Every New Order'}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                {lang === 'de'
                  ? 'Sobald ein Kunde bestellt, wird genau 1 Bon ohne Browser-Druckdialog auf Ihrem ZJ-8330-L gedruckt.'
                  : 'Immediately prints 1 receipt on ZJ-8330-L without showing any browser print dialog.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoPrint}
              disabled={actionLoading}
              style={{
                position: 'relative',
                width: '54px',
                height: '28px',
                borderRadius: '14px',
                background: autoPrint ? '#10b981' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                padding: '3px',
                transition: 'background 0.2s ease',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  transform: autoPrint ? 'translateX(26px)' : 'translateX(0px)',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </button>
          </div>

          {/* Printer Configuration Form */}
          <div
            style={{
              background: isLight ? '#ffffff' : '#0b0f19',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="#e11d48" />
              <span>{lang === 'de' ? 'Drucker-Konfiguration' : 'Printer Configuration'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Target Printer Select */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                  {lang === 'de' ? 'Ziel-Drucker (Windows):' : 'Target Printer (Windows):'}
                </label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => {
                    setSelectedPrinter(e.target.value);
                    handleSaveConfig({ printerName: e.target.value });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <option value="">{lang === 'de' ? '-- Automatisch erkennen --' : '-- Auto-Detect --'}</option>
                  {printers.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.port || p.driver})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                  {lang === 'de'
                    ? 'Empfehlung: "Generic / Text Only" (USB001) oder "POS-80" / "ZJ-8330-L".'
                    : 'Recommended: "Generic / Text Only" (USB001) or "POS-80" / "ZJ-8330-L".'}
                </div>
              </div>

              {/* Paper Width */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                  {lang === 'de' ? 'Bon-Breite:' : 'Roll Width:'}
                </label>
                <select
                  value={paperWidth}
                  onChange={(e) => {
                    const w = parseInt(e.target.value, 10);
                    setPaperWidth(w);
                    handleSaveConfig({ paperWidth: w });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <option value={80}>80 mm (Standard - ZJ-8330-L / 48 Spalten)</option>
                  <option value={58}>58 mm (Schmal / 32 Spalten)</option>
                </select>
              </div>

              {/* Number of Copies */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                  {lang === 'de' ? 'Anzahl Exemplare je Bestellung:' : 'Copies per order:'}
                </label>
                <select
                  value={copies}
                  onChange={(e) => {
                    const c = parseInt(e.target.value, 10);
                    setCopies(c);
                    handleSaveConfig({ copies: c });
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                    background: isLight ? '#f8fafc' : '#1e293b',
                    color: isLight ? '#0f172a' : '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  <option value={1}>1 Bon (Küche / Kasse)</option>
                  <option value={2}>2 Bons (1x Küche + 1x Fahrer / Kunde)</option>
                </select>
              </div>

              {/* Checkboxes: Cut Paper & Drawer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cutPaper}
                    onChange={(e) => {
                      setCutPaper(e.target.checked);
                      handleSaveConfig({ cutPaper: e.target.checked });
                    }}
                  />
                  <Scissors size={14} color="#e11d48" />
                  <span>{lang === 'de' ? 'Automatischer Papierschnitt (Cutter)' : 'Auto-cut paper'}</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={openDrawer}
                    onChange={(e) => {
                      setOpenDrawer(e.target.checked);
                      handleSaveConfig({ openDrawer: e.target.checked });
                    }}
                  />
                  <DollarSign size={14} color="#10b981" />
                  <span>{lang === 'de' ? 'Geldlade öffnen bei Barzahlung' : 'Open cash drawer on cash order'}</span>
                </label>
              </div>
            </div>

            {/* Clear Stuck Queue */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={handleClearJobs}
                disabled={actionLoading}
                style={{
                  background: 'transparent',
                  color: isLight ? '#64748b' : '#94a3b8',
                  border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={13} />
                <span>{lang === 'de' ? 'Windows-Druckerschlange leeren' : 'Purge Windows print queue'}</span>
              </button>
            </div>
          </div>

          {/* Recent Print Jobs Ledger & Retry */}
          <div
            style={{
              background: isLight ? '#ffffff' : '#0b0f19',
              border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color="#e11d48" />
                <span>{lang === 'de' ? 'Druck-Verlauf & Auftragsstatus' : 'Print Job History & Status'}</span>
              </div>
              <span style={{ fontSize: '11.5px', color: isLight ? '#64748b' : '#94a3b8' }}>
                {jobs.length} {lang === 'de' ? 'letzte Aufträge' : 'recent jobs'}
              </span>
            </div>

            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px', color: isLight ? '#94a3b8' : '#64748b', fontSize: '12.5px' }}>
                {lang === 'de' ? 'Noch keine Druckaufträge erfasst.' : 'No print jobs recorded yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {jobs.map(job => (
                  <div
                    key={job.jobId}
                    style={{
                      background: isLight ? '#f8fafc' : '#131b2e',
                      border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', color: isLight ? '#0f172a' : '#ffffff' }}>
                          #{job.orderNumber}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: job.status === 'printed' ? '#10b981' : job.status === 'in_progress' ? '#f59e0b' : '#ef4444',
                          color: '#ffffff'
                        }}>
                          {job.status === 'printed' ? 'Gedruckt' : job.status === 'in_progress' ? 'Druckt...' : 'Fehlgeschlagen'}
                        </span>
                        <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8' }}>
                          {job.customerName} • {job.deliveryType === 'delivery' ? 'Lieferung' : 'Abholung'}
                        </span>
                      </div>
                      {job.error && (
                        <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '2px' }}>
                          ⚠️ {job.error}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: isLight ? '#64748b' : '#94a3b8' }}>
                        {job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetry(job.jobId)}
                        disabled={actionLoading}
                        title={lang === 'de' ? 'Erneut drucken' : 'Reprint'}
                        style={{
                          background: isLight ? '#ffffff' : '#1e293b',
                          color: isLight ? '#0f172a' : '#cbd5e1',
                          border: isLight ? '1px solid #cbd5e1' : '1px solid #334155',
                          borderRadius: '6px',
                          padding: '5px 10px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>{lang === 'de' ? 'Erneut' : 'Reprint'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Windows Setup Instructions Accordion */}
          <div
            style={{
              background: isLight ? '#f1f5f9' : '#0f172a',
              borderRadius: '12px',
              border: isLight ? '1px solid #cbd5e1' : '1px solid #1e293b',
              overflow: 'hidden'
            }}
          >
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '14px 18px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: isLight ? '#0f172a' : '#ffffff',
                fontWeight: '700',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={15} color="#0284c7" />
                <span>{lang === 'de' ? 'Windows Autostart & USB-Einrichtung für Zjiang ZJ-8330-L' : 'Windows Autostart & Setup Instructions'}</span>
              </div>
              <HelpCircle size={15} color="#64748b" />
            </button>

            {showHelp && (
              <div style={{ padding: '0 18px 16px 18px', fontSize: '12.5px', lineHeight: '1.6', color: isLight ? '#334155' : '#cbd5e1' }}>
                <ol style={{ paddingLeft: '18px', margin: '4px 0 10px 0' }}>
                  <li><strong>USB-Drucker anschließen:</strong> Stecken Sie den Zjiang ZJ-8330-L per USB in den Laptop und schalten Sie ihn ein.</li>
                  <li><strong>Windows Treiber prüfen:</strong> In Windows <em>Systemsteuerung &gt; Geräte und Drucker</em> sollte der Drucker als <code>Generic / Text Only</code> (auf USB001) oder <code>POS-80</code> angezeigt werden.</li>
                  <li><strong>Dienst starten:</strong> Doppelklicken Sie im Ordner auf <code>start-printer.bat</code>.</li>
                  <li><strong>Windows Autostart einrichten:</strong> Drücken Sie <kbd>Win + R</kbd>, tippen Sie <code>shell:startup</code> ein und legen Sie eine Verknüpfung von <code>start-printer.bat</code> dort ab. Der Druckdienst startet dann automatisch bei jedem Hochfahren des Laptops!</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isLight ? '#f8fafc' : '#0f172a'
          }}
        >
          <div style={{ fontSize: '12px', color: isLight ? '#64748b' : '#94a3b8' }}>
            Port 9090 • ESC/POS Raw Spooler • CP437 Deutsche Umlaute
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 20px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {lang === 'de' ? 'Schließen' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
