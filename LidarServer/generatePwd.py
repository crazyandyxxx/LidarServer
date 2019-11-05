import wmi
c = wmi.WMI()
password = c.Win32_Processor()[0].ProcessorId.strip()+c.Win32_DiskDrive()[0].SerialNumber.strip()
with open("password.pwd","w") as f:
    f.write(password)