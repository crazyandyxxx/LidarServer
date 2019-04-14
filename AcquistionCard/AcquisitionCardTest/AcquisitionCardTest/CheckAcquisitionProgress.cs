using CyUSB;
using System;
using System.Threading;

namespace AcquisitionCardTest
{
    partial class Form1
    {
        private void CheckAcquistionProgress()
        {
            checkProgressThr = new Thread(() => CheckProgressLoop());
            checkProgressThr.Start();
        }

        private void CheckProgressLoop()
        {
            while (true)
            {
                if (CtrlEndPt != null)
                {
                    CtrlEndPt.Target = CyConst.TGT_DEVICE;

                    CtrlEndPt.ReqType = 0x40;

                    CtrlEndPt.ReqCode = 0xb8;

                    CtrlEndPt.Value = 0x00ba;

                    CtrlEndPt.Index = 0x0000;

                    int len = 2;

                    byte[] buf = new byte[] { 0xC1, 0x01 };

                    CtrlEndPt.Write(ref buf, ref len);
                }

                if (MyDevice.BulkInEndPt != null)
                {
                    int len = 512;

                    byte[] buf = new byte[len];

                    MyDevice.BulkInEndPt.XferData(ref buf, ref len);

                    uint currentAccumNum = BitConverter.ToUInt32(buf, 1);

                    UpdateAcquisitionProgress(currentAccumNum);

                    if (currentAccumNum >= accumTimes) break;
                }
                Thread.Sleep(80);
            }
            CheckAcquisitionChannelData(chA, chB);
            count++;
            UpdateAcquisitionCount(count);
            UpdateChannelDataList(chA, chB);
            if (continued)
                StartAcquisition();
            else
                InitBtnStart();
        }
    }
}