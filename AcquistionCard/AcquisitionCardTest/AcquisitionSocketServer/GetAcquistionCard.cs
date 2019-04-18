using CyUSB;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        /// <summary>  
        /// 连接采集卡  
        /// </summary>  
        static void GetAcqCard()
        {
            usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);//连接采集卡
            MyDevice = usbDevices[0] as CyUSBDevice;
            if (MyDevice != null)
            {
                CtrlEndPt = MyDevice.ControlEndPt;
                if (CtrlEndPt != null)
                {
                    CtrlEndPt.Target = CyConst.TGT_DEVICE;
                    CtrlEndPt.ReqType = 0x40;
                    CtrlEndPt.ReqCode = 0xb8;
                    CtrlEndPt.Value = 0x00ba;
                    CtrlEndPt.Index = 0x0000;
                }
            }
            else
            {
                Console.WriteLine("采集卡未连接");
            }
        }
    }
}
