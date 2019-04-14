using CyUSB;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace AcquisitionCardTest
{
    public partial class Form1 : Form
    {
        CyControlEndPoint CtrlEndPt = null;
        CyUSBDevice MyDevice = null;
        //频率单位Hz，周期单位s, 测量距离单位m, 触发阈值单位mV
        uint frequency = 2500, duration = 30, range = 30000;
        ushort trigTh = 680, chATh = 680, chBTh = 680, chCTh = 680;
        byte[] acquisitionStartCmd = new byte[17];
        byte[] chA, chB;
        uint accumTimes;
        ushort binNum;
        bool acquisitionStopped = true;
        byte acqStoppedFlag = 0;
        bool continued = false;
        long count = 0;

        float resolution = 15;
        Thread checkProgressThr;

        public Form1()
        {
            InitializeComponent();

            USBDeviceList usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);

            MyDevice = usbDevices[0] as CyUSBDevice;

            if (MyDevice != null)
                CtrlEndPt = MyDevice.ControlEndPt;
            else
            {
                labelCardStatus.Text = "No acquisition card was found";
                buttonStart.Enabled = false;
            }

            resolutionCombo.SelectedIndex = 2;

            listView1.View = View.Details;
            listView1.GridLines = true;

            listView1.Columns.Add("SN");
            listView1.Columns.Add("CH_A");
            listView1.Columns.Add("CH_B");

        }

        private void buttonStart_Click(object sender, EventArgs e)
        {
            if (acquisitionStopped)
            {
                //检查输入有效性
                if (!CheckInputValidation()) return;
                //构造采集卡开始指令
                ConstructAcquisitionStartCmd();

                chA = new byte[binNum * 4];
                chB = new byte[binNum * 4];
                StartAcquisition();
                buttonStart.Text = "Stop";
            }
            else
            {
                //终止采集
                StopAcquisition();
                buttonStart.Text = "Start";
            }
            acquisitionStopped = !acquisitionStopped;
        }

        private void StartAcquisition()
        {        
            if (CtrlEndPt != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;

                CtrlEndPt.ReqType = 0x40;

                CtrlEndPt.ReqCode = 0xb8;

                CtrlEndPt.Value = 0x00ba;

                CtrlEndPt.Index = 0x0000;

                int len = acquisitionStartCmd.Length;

                CtrlEndPt.Write(ref acquisitionStartCmd, ref len);
            }

            //查询采集进度
            CheckAcquistionProgress();
        }

        private int CheckAcquisitionChannelData(byte[] ChA, byte[] ChB)
        {
            if (MyDevice != null)
            {
                var CtrlEndPt = MyDevice.ControlEndPt;
                CtrlEndPt.Target = CyConst.TGT_DEVICE;
                CtrlEndPt.ReqType = 0x40;
                CtrlEndPt.ReqCode = 0xb8;
                CtrlEndPt.Value = 0x00ba;
                CtrlEndPt.Index = 0x0000;

                var readLength = chA.Length;
                var readTimes = (int)Math.Ceiling(readLength / 512.0);
                byte readLen = (byte)(readTimes / 2);

                int len = 3;
                byte[] bufA = new byte[] { 0xC2, 0xca, readLen };
                CtrlEndPt.Write(ref bufA, ref len);

                len = 512;
                bufA = new byte[len];
                for (int i = 0; i < readTimes - 1; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufA, ref len);
                    Array.Copy(bufA, 0, ChA, 512 * i, 512);
                }
                MyDevice.BulkInEndPt.XferData(ref bufA, ref len);
                Array.Copy(bufA, 0, ChA, 512 * (readTimes - 1), readLength % 512);

                len = 3;
                byte[] bufB = new byte[] { 0xC2, 0xcb, readLen };
                CtrlEndPt.Write(ref bufB, ref len);

                len = 512;
                bufB = new byte[len];
                for (int i = 0; i < readTimes - 1; i++)
                {
                    MyDevice.BulkInEndPt.XferData(ref bufB, ref len);
                    Array.Copy(bufB, 0, ChB, 512 * i, 512);
                }
                MyDevice.BulkInEndPt.XferData(ref bufB, ref len);
                Array.Copy(bufB, 0, ChB, 512 * (readTimes - 1), readLength % 512);

                return 0;
            }
            else
                return -1;
        }

        private void UpdateAcquisitionProgress(uint currentAccumNum)
        {
            labelCardStatus.Invoke((MethodInvoker)delegate
            {
                labelCardStatus.Text = currentAccumNum + "/" + accumTimes;
                acquisitonProgressBar.Value = (int)((float)currentAccumNum / accumTimes *
                                                   (acquisitonProgressBar.Maximum - acquisitonProgressBar.Minimum) +
                                                   acquisitonProgressBar.Minimum);
            });
            
        }

        private void UpdateAcquisitionCount(long count)
        {
            labelCount.Invoke((MethodInvoker)delegate
            {
                labelCount.Text = count.ToString();            
            });

        }

        private void UpdateChannelDataList(byte[] chA, byte[] chB)
        {
            labelCount.BeginInvoke((MethodInvoker)delegate
            {
                listView1.Items.Clear();
                for(int i=0; i<chA.Length/4;i++)
                    listView1.Items.Add(new ListViewItem(new string[] { (i+1).ToString(),BitConverter.ToInt32(chA, i * 4).ToString(), BitConverter.ToInt32(chB, i * 4).ToString() }));
            });
        }

        private void InitBtnStart()
        {
            acqStoppedFlag = 0;
            acquisitionStopped = true;
            labelCardStatus.BeginInvoke((MethodInvoker)delegate
            {
                buttonStart.Text = "Start";
            });
        }

        private void StopAcquisition()
        {
            if (CtrlEndPt != null)
            {
                CtrlEndPt.Target = CyConst.TGT_DEVICE;

                CtrlEndPt.ReqType = 0x40;

                CtrlEndPt.ReqCode = 0xb8;

                CtrlEndPt.Value = 0x00ba;

                CtrlEndPt.Index = 0x0000;

                int len = 2;

                byte[] buf = new byte[] { 0xC4, 0xa0 };

                CtrlEndPt.Write(ref buf, ref len);
            }

            checkProgressThr.Abort();
        }

        private void checkBox1_CheckedChanged(object sender, EventArgs e)
        {
            continued = checkBox1.Checked;
        }
    }
}
