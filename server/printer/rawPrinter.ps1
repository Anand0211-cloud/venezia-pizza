param (
    [Parameter(Mandatory=$false)][string]$Action = "list",
    [Parameter(Mandatory=$false)][string]$PrinterName = "",
    [Parameter(Mandatory=$false)][string]$FilePath = "",
    [Parameter(Mandatory=$false)][string]$DocName = "Venezia Receipt"
)

# Initialize Win32 Raw Spooler Type
$csharpSource = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class WinSpoolRawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendRawBytes(string szPrinterName, byte[] pBytes, string szDocName, out string errorMsg)
    {
        errorMsg = "";
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = szDocName;
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero))
        {
            int err = Marshal.GetLastWin32Error();
            errorMsg = "OpenPrinter failed with Win32 error code: " + err;
            return false;
        }

        if (!StartDocPrinter(hPrinter, 1, di))
        {
            int err = Marshal.GetLastWin32Error();
            errorMsg = "StartDocPrinter failed with Win32 error code: " + err;
            ClosePrinter(hPrinter);
            return false;
        }

        if (!StartPagePrinter(hPrinter))
        {
            int err = Marshal.GetLastWin32Error();
            errorMsg = "StartPagePrinter failed with Win32 error code: " + err;
            EndDocPrinter(hPrinter);
            ClosePrinter(hPrinter);
            return false;
        }

        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
        Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);

        int dwWritten = 0;
        bool success = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);
        Marshal.FreeCoTaskMem(pUnmanagedBytes);

        if (!success)
        {
            int err = Marshal.GetLastWin32Error();
            errorMsg = "WritePrinter failed with Win32 error code: " + err;
        }

        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return success && (dwWritten == pBytes.Length);
    }
}
"@

try {
    if (-not ([System.Management.Automation.PSTypeName]'WinSpoolRawPrinter').Type) {
        Add-Type -TypeDefinition $csharpSource -Language CSharp
    }
} catch {
    # Type might already be added in current runspace
}

switch ($Action.ToLower()) {
    "list" {
        $printers = Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus, Shared, ShareName
        $json = $printers | ConvertTo-Json -Compress
        Write-Output $json
    }

    "status" {
        if (-not $PrinterName) {
            Write-Error "PrinterName is required for status check"
            exit 1
        }
        $printer = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
        if (-not $printer) {
            $res = @{
                found = $false
                error = "Printer '$PrinterName' not found in Windows printers."
            }
            Write-Output ($res | ConvertTo-Json -Compress)
            exit 0
        }
        $jobs = Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue
        $res = @{
            found = $true
            name = $printer.Name
            driver = $printer.DriverName
            port = $printer.PortName
            status = "$($printer.PrinterStatus)"
            jobCount = if ($jobs) { @($jobs).Count } else { 0 }
        }
        Write-Output ($res | ConvertTo-Json -Compress)
    }

    "print" {
        if (-not $PrinterName) {
            $err = @{ success = $false; error = "PrinterName parameter is missing" }
            Write-Output ($err | ConvertTo-Json -Compress)
            exit 1
        }
        if (-not $FilePath -or -not (Test-Path $FilePath)) {
            $err = @{ success = $false; error = "File '$FilePath' does not exist" }
            Write-Output ($err | ConvertTo-Json -Compress)
            exit 1
        }

        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        $errMsg = ""
        $ok = [WinSpoolRawPrinter]::SendRawBytes($PrinterName, $bytes, $DocName, [ref]$errMsg)

        $result = @{
            success = [bool]$ok
            bytesSent = $bytes.Length
            error = $errMsg
            printerName = $PrinterName
            docName = $DocName
        }
        Write-Output ($result | ConvertTo-Json -Compress)
    }

    "clearjobs" {
        if (-not $PrinterName) {
            Write-Error "PrinterName is required"
            exit 1
        }
        Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue | Remove-PrintJob -ErrorAction SilentlyContinue
        $res = @{ success = $true; message = "Cleared print jobs for $PrinterName" }
        Write-Output ($res | ConvertTo-Json -Compress)
    }

    default {
        Write-Error "Unknown action '$Action'"
        exit 1
    }
}
