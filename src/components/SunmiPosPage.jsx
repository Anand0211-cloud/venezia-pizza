import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Eye,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  ShoppingBag,
  Car,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { getOrders, supabase, playOrderChime } from '../lib/supabaseClient';

export default function SunmiPosPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [printedOrderIds, setPrintedOrderIds] = useState(() => {
    try {
      const saved = localStorage.getItem('sunmi_printed_orders');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const printAreaRef = useRef(null);

  // Persist printed IDs
  const markAsPrinted = (orderId) => {
    setPrintedOrderIds((prev) => {
      const updated = new Set(prev);
      updated.add(orderId);
      try {
        localStorage.setItem(
          'sunmi_printed_orders',
          JSON.stringify(Array.from(updated).slice(-500))
        );
      } catch (e) {}
      return updated;
    });
  };

  // Fetch orders from Supabase
  const loadOrders = async (isAuto = false) => {
    try {
      const list = await getOrders();
      if (list && Array.isArray(list)) {
        // Filter out test account records
        const valid = list.filter(
          (o) =>
            o &&
            o.id &&
            !o.order_number?.startsWith('ACC-') &&
            !(o.note && o.note.includes('Kundenkonto Registrierung'))
        );

        setOrders(valid);
        setLastRefreshed(new Date());

        // Check if there is a new unprinted order
        if (valid.length > 0) {
          const newest = valid[0];
          // If newest order was created within the last 5 minutes and not printed yet
          const orderAgeMs = Date.now() - new Date(newest.created_at).getTime();
          if (
            autoPrint &&
            orderAgeMs < 10 * 60 * 1000 &&
            !printedOrderIds.has(newest.id)
          ) {
            triggerPrint(newest);
          }
        }
      }
    } catch (err) {
      console.warn('[Sunmi POS] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Print to Sunmi 58mm thermal printer
  const triggerPrint = (order) => {
    if (!order) return;
    setActivePrintOrder(order);
    markAsPrinted(order.id);

    if (soundEnabled) {
      playOrderChime();
    }

    // Give DOM time to populate print area, then trigger print
    setTimeout(() => {
      // Check for native Sunmi Web Printer SDK if available
      if (typeof window.SunmiPrinter !== 'undefined') {
        try {
          window.SunmiPrinter.print();
          return;
        } catch (e) {}
      }

      // Standard Sunmi OS Web Print hook
      window.print();
    }, 250);
  };

  // Initial load and Realtime listener
  useEffect(() => {
    loadOrders();

    // Polling fallback every 4 seconds
    const interval = setInterval(() => {
      loadOrders(true);
    }, 4000);

    // Supabase Realtime Channel
    let channel = null;
    if (supabase) {
      channel = supabase
        .channel('sunmi-pos-orders')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new;
            if (newOrder && newOrder.id) {
              if (soundEnabled) playOrderChime();
              setTimeout(() => {
                loadOrders();
              }, 1200);
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [autoPrint, soundEnabled, printedOrderIds]);

  // Helpers
  const formatPrice = (val) => Number(val || 0).toFixed(2).replace('.', ',') + ' €';
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const isCOD = (order) => {
    const raw = String(order.note || '').toLowerCase();
    const isPaid =
      raw.includes('paypal (paid)') ||
      raw.includes('sumup (paid)') ||
      raw.includes('bezahlt') ||
      String(order.status || '').toLowerCase().includes('paid');
    return !isPaid;
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900 font-sans pb-12 select-none">
      {/* 1. TOP HEADER (Matching Sunmi V2 Status Design) */}
      <header className="sticky top-0 z-40 bg-[#d32f2f] text-white shadow-md">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              🍕
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-tight">
                Venezia Pizzaservice
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-red-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sunmi POS Terminal</span>
                <span>•</span>
                <span>{orders.length} Bestellungen</span>
              </div>
            </div>
          </div>

          {/* Quick Action Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Ton an' : 'Ton stumm'}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-white/20 text-white' : 'bg-black/30 text-red-200'
              }`}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={() => loadOrders()}
              title="Aktualisieren"
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors active:scale-95"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status Sub-bar */}
        <div className="bg-[#b71c1c] px-4 py-1.5 text-xs flex items-center justify-between text-red-100 font-medium">
          <div className="flex items-center gap-2">
            <span>Auto-Druck:</span>
            <button
              onClick={() => setAutoPrint(!autoPrint)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                autoPrint ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {autoPrint ? 'AKTIV (AN)' : 'AUS'}
            </button>
          </div>
          <div>58mm Thermo-Drucker</div>
        </div>
      </header>

      {/* 2. ORDERS LIST (Styled exactly like Sunmi V2 Screen) */}
      <main className="max-w-md mx-auto px-3 py-3 space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-slate-200 mt-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-bold text-slate-700 text-base">Keine Bestellungen</h3>
            <p className="text-xs text-slate-500 mt-1">
              Warte auf eingehende Bestellungen aus dem Onlineshop...
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const isPrinted = printedOrderIds.has(order.id);
            const isDelivery = String(order.delivery_type || '')
              .toLowerCase()
              .includes('deliv') ||
              String(order.delivery_type || '')
                .toLowerCase()
                .includes('lief');
            const cod = isCOD(order);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all"
              >
                {/* Card Header */}
                <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">
                      {formatTime(order.created_at)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                        isDelivery
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {isDelivery ? <Car size={12} /> : <ShoppingBag size={12} />}
                      {isDelivery ? 'LIEFERUNG' : 'ABHOLUNG'}
                    </span>
                  </div>

                  {/* Print Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isPrinted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-100 text-red-700 border border-red-300 animate-pulse'
                    }`}
                  >
                    {isPrinted ? (
                      <>
                        <CheckCircle2 size={11} />
                        Gedruckt
                      </>
                    ) : (
                      <>
                        <AlertCircle size={11} />
                        NEU
                      </>
                    )}
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-3.5 py-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Bestell-Nr {order.order_number || order.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Customer & Address */}
                  <div className="mt-1.5 flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {order.customer_name || 'Gast'}
                      </h4>
                      {isDelivery && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-tight">
                          {order.street}
                          {order.zip_city && `, ${order.zip_city}`}
                        </p>
                      )}
                      {order.customer_phone && (
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium mt-1 hover:underline"
                        >
                          <Phone size={11} />
                          {order.customer_phone}
                        </a>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold text-slate-900">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Pill */}
                  <div className="mt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        cod
                          ? 'bg-orange-100 text-orange-950 border border-orange-300'
                          : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                      }`}
                    >
                      {cod ? <Banknote size={12} /> : <CreditCard size={12} />}
                      {cod ? 'BARZAHLUNG (C.O.D.)' : 'ONLINE BEZAHLT'}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-xs"
                  >
                    <Eye size={14} />
                    ANSEHEN
                  </button>

                  <button
                    onClick={() => triggerPrint(order)}
                    className="flex-1 py-2 px-3 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-transform shadow-xs"
                  >
                    <Printer size={14} />
                    DRUCKEN
                  </button>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* 3. ORDER DETAILS / RECEIPT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#d32f2f] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Bestellung {selectedOrder.order_number}
                </h3>
                <span className="text-xs text-red-100">
                  {formatDate(selectedOrder.created_at)} •{' '}
                  {formatTime(selectedOrder.created_at)} Uhr
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Receipt View */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Customer Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                  Kunde & Adresse
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedOrder.customer_name}
                </p>
                {selectedOrder.customer_phone && (
                  <p className="text-slate-700 mt-0.5">
                    Tel: {selectedOrder.customer_phone}
                  </p>
                )}
                {selectedOrder.street && (
                  <p className="text-slate-700 mt-0.5">
                    {selectedOrder.street}, {selectedOrder.zip_city}
                  </p>
                )}
              </div>

              {/* Payment Box */}
              <div
                className={`p-3 rounded-lg border font-medium ${
                  isCOD(selectedOrder)
                    ? 'bg-orange-50 border-orange-200 text-orange-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">
                    {isCOD(selectedOrder)
                      ? '⚠️ Barzahlung bei Lieferung (C.O.D.)'
                      : '✅ Online bezahlt'}
                  </span>
                  <span className="font-extrabold text-sm">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
                {isCOD(selectedOrder) && (
                  <span className="text-[11px] block mt-1 font-bold text-orange-900">
                    Bitte beim Kunden kassieren: {formatPrice(selectedOrder.total)}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-2">
                  Bestellte Artikel
                </span>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {(selectedOrder.order_items || []).map((item, idx) => (
                    <div key={idx} className="p-2.5">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">
                          {item.quantity}x {item.item_name}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0 ml-2">
                          {formatPrice(item.total_price || item.unit_price * item.quantity)}
                        </span>
                      </div>

                      {item.selected_size && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Größe: {item.selected_size}
                        </p>
                      )}
                      {item.is_american && (
                        <p className="text-[11px] text-slate-500">American Crust</p>
                      )}

                      {Array.isArray(item.toppings_selected) &&
                        item.toppings_selected.length > 0 && (
                          <p className="text-[11px] text-blue-600 mt-0.5">
                            + Extras:{' '}
                            {item.toppings_selected
                              .map((t) =>
                                typeof t === 'string'
                                  ? t
                                  : t.name || t.topping_name
                              )
                              .join(', ')}
                          </p>
                        )}

                      {item.special_instructions && (
                        <p className="text-[11px] text-amber-700 italic mt-0.5">
                          Wunsch: {item.special_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Kundenhinweis:</span>
                  {selectedOrder.note}
                </div>
              )}

              {/* Totals Summary */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Zwischensumme:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Lieferkosten:</span>
                    <span>{formatPrice(selectedOrder.delivery_fee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                  <span>Gesamtbetrag:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 text-xs"
              >
                Schließen
              </button>
              <button
                onClick={() => {
                  triggerPrint(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-2.5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={15} />
                Jetzt Drucken
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HIDDEN PRINT AREA FOR SUNMI 58mm THERMAL PRINTER */}
      {activePrintOrder && (
        <div id="sunmi-receipt-print-area" className="hidden print:block text-black">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0' }}>
              VENEZIA PIZZA
            </h2>
            <p style={{ fontSize: '10px', margin: '2px 0 0' }}>
              Martin-Luther-Strasse 68
            </p>
            <p style={{ fontSize: '10px', margin: '1px 0' }}>
              08525 Plauen
            </p>
            <p style={{ fontSize: '10px', margin: '1px 0' }}>
              Tel.: 03741 / 522 860
            </p>
            <p style={{ fontSize: '10px', margin: '1px 0' }}>
              Mobil: 0160 / 11 77 240
            </p>
            <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
          </div>

          <div style={{ fontSize: '11px', marginBottom: '6px' }}>
            <div>
              <strong>Bestell-Nr: {activePrintOrder.order_number}</strong>
            </div>
            <div>
              Datum: {formatDate(activePrintOrder.created_at)}{' '}
              {formatTime(activePrintOrder.created_at)} Uhr
            </div>
            <div
              style={{
                border: '1px solid #000',
                padding: '3px',
                textAlign: 'center',
                margin: '5px 0',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {String(activePrintOrder.delivery_type).toLowerCase().includes('deliv')
                ? '>> LIEFERUNG <<'
                : '>> ABHOLUNG <<'}
            </div>
          </div>

          <div style={{ fontSize: '11px', marginBottom: '6px' }}>
            <div>
              <strong>Kunde:</strong> {activePrintOrder.customer_name}
            </div>
            {activePrintOrder.customer_phone && (
              <div>
                <strong>Tel:</strong> {activePrintOrder.customer_phone}
              </div>
            )}
            {activePrintOrder.street && (
              <div>
                <strong>Adr:</strong> {activePrintOrder.street}
              </div>
            )}
            {activePrintOrder.zip_city && <div>{activePrintOrder.zip_city}</div>}
          </div>

          {/* Payment Box */}
          <div
            style={{
              border: '2px solid #000',
              padding: '4px',
              textAlign: 'center',
              margin: '6px 0',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {isCOD(activePrintOrder) ? (
              <>
                <div>*** BARZAHLUNG (C.O.D.) ***</div>
                <div style={{ fontSize: '13px', marginTop: '2px' }}>
                  ZU KASSIEREN: {formatPrice(activePrintOrder.total)}
                </div>
              </>
            ) : (
              <>
                <div>*** ONLINE BEZAHLT ***</div>
                <div style={{ fontSize: '10px' }}>NICHT KASSIEREN</div>
              </>
            )}
          </div>

          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          {/* Items */}
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th>Art.</th>
                <th style={{ textAlign: 'right' }}>Anz</th>
                <th style={{ textAlign: 'right' }}>EUR</th>
              </tr>
            </thead>
            <tbody>
              {(activePrintOrder.order_items || []).map((it, i) => (
                <React.Fragment key={i}>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingTop: '3px' }}>
                      {it.item_name}
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '3px' }}>
                      {it.quantity}x
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '3px' }}>
                      {formatPrice(it.total_price || it.unit_price * it.quantity)}
                    </td>
                  </tr>
                  {(it.selected_size || it.is_american) && (
                    <tr>
                      <td colSpan="3" style={{ fontSize: '9px', paddingLeft: '8px' }}>
                        * {it.selected_size} {it.is_american ? '(American)' : ''}
                      </td>
                    </tr>
                  )}
                  {Array.isArray(it.toppings_selected) &&
                    it.toppings_selected.length > 0 && (
                      <tr>
                        <td colSpan="3" style={{ fontSize: '9px', paddingLeft: '8px' }}>
                          +{' '}
                          {it.toppings_selected
                            .map((t) => (typeof t === 'string' ? t : t.name || t.topping_name))
                            .join(', ')}
                        </td>
                      </tr>
                    )}
                  {it.special_instructions && (
                    <tr>
                      <td colSpan="3" style={{ fontSize: '9px', paddingLeft: '8px', fontStyle: 'italic' }}>
                        ! {it.special_instructions}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />

          {/* Total */}
          <div style={{ fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>
            <div>GESAMTBETRAG: {formatPrice(activePrintOrder.total)}</div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px' }}>
            Vielen Dank für Ihre Bestellung!
          </div>
        </div>
      )}
    </div>
  );
}
