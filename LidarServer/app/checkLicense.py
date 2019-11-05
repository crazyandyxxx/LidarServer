from werkzeug.security import check_password_hash
import wmi

def verifyLicense():
    c = wmi.WMI()
    password = c.Win32_Processor()[0].ProcessorId.strip()+c.Win32_DiskDrive()[0].SerialNumber.strip()+ 'crazyandy'
    try:
        with open("./license.lic",'r') as load_f:
            hashfile = load_f.read()
            return check_password_hash(hashfile, password)
    except:
        return False
 