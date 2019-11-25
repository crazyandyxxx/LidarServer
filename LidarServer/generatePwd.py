import wmi
c = wmi.WMI()
processors = c.Win32_Processor()
disks = c.Win32_DiskDrive()
password = processors[0].ProcessorId.strip()+disks[0].SerialNumber.strip()
with open("password.pwd","w") as f:
    f.write(password)