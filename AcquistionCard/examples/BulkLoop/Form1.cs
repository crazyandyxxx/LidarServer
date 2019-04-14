using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using System.Threading;
using CyUSB;

namespace BulkLoop
{
    public partial class Form1 : Form
    {
        CyUSBDevice         loopDevice  = null;
        USBDeviceList       usbDevices  = null;
        CyBulkEndPoint      inEndpoint  = null;
        CyBulkEndPoint      outEndpoint = null;

        Thread  tXfers;
        bool    bRunning = false;

        int     value;
        long    outCount, inCount;

        const int XFERSIZE  = 256;
        byte[]  outData     = new byte[XFERSIZE];
        byte[]  inData      = new byte[XFERSIZE];

        // These 2 needed for TransfersThread to update the UI
        delegate void UpdateUICallback();
        UpdateUICallback updateUI;
     

        public Form1()
        {
            InitializeComponent();

            // Setup the callback routine for updating the UI
            updateUI    = new UpdateUICallback(StatusUpdate);


            // Create a list of CYUSB devices
            usbDevices  = new USBDeviceList(CyConst.DEVICES_CYUSB);

            //Adding event handlers for device attachment and device removal
            usbDevices.DeviceAttached += new EventHandler(usbDevices_DeviceAttached);
            usbDevices.DeviceRemoved += new EventHandler(usbDevices_DeviceRemoved);

            //The below function sets the device with particular VID and PId and searches for the device with the same VID and PID.
            setDevice();
        }

        
        /* Summary
            This is the event handler for Device removal event.
        */
        void usbDevices_DeviceRemoved(object sender, EventArgs e)
        {
            setDevice();
        }


        /* Summary
            This is the event handler for Device Attachment event.
        */
        void usbDevices_DeviceAttached(object sender, EventArgs e)
        {
            setDevice();
        }


        /* Summary
            The function sets the device, as the one having VID=04b4 and PID=1004
            This will detect only the devices with the above VID,PID combinations
        */
        public void setDevice()
        {          
            loopDevice = usbDevices[0x04b4, 0x1004] as CyUSBDevice;

            StartBtn.Enabled = (loopDevice != null);

            if (loopDevice != null)
                Text = loopDevice.FriendlyName;
            else
                Text = "Bulkloop - no device";

            // Set the IN and OUT endpoints per the selected radio buttons.
            EptPair1Btn_Click(this, null);
        }


        /* Summary
            closing the open form
        */
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            // If close was selected while running the loopback, shut it down.
            if (bRunning)
                StartBtn_Click(this, null);

            if (usbDevices != null) usbDevices.Dispose();
        }


        /* Summary
            set the endpoints 2/4 as OUT and 4/8 as IN
        */
        private void EptPair1Btn_Click(object sender, EventArgs e)
        {
            if (loopDevice != null)
            {
                if (EptPair1Btn.Checked)
                {
                    outEndpoint = loopDevice.EndPointOf(0x02) as CyBulkEndPoint;
                    inEndpoint = loopDevice.EndPointOf(0x86) as CyBulkEndPoint;
                }
                else
                {
                    outEndpoint = loopDevice.EndPointOf(0x04) as CyBulkEndPoint;
                    inEndpoint = loopDevice.EndPointOf(0x88) as CyBulkEndPoint;
                }

                outEndpoint.TimeOut = 1000;
                inEndpoint.TimeOut = 1000;
            }
        }



        /* Summary
           Called from TransfersThread().When you click on start button, it will create and start a new thread named 'TransfersThread'.
            The function outputs the bytes transfered to outData[] buffer. 
        */
        private void SetOutputData()
        {

            if (ConstByteBtn.Checked)
            {
                for (int i = 0; i < XFERSIZE; i++)
                    outData[i] = (byte)value;
            }

            if (RandomByteBtn.Checked)
            {
                Random r = new Random(value);
                r.NextBytes(outData);
            }

            if (IncrByteBtn.Checked)
            {
                for (int i = 0; i < XFERSIZE; i++)
                    outData[i] = (byte)value++;
            }

            if (IncrWordBtn.Checked)
            {
                for (int i = 0; i < XFERSIZE; i += 4)
                {
                    outData[i] = (byte)(value >> 24);
                    outData[i + 1] = (byte)(value >> 16);
                    outData[i + 2] = (byte)(value >> 8);
                    outData[i + 3] = (byte)value;

                    value++;
                }
            }
        }


        /* Summary
            Executes on Start button click
        */
        private void StartBtn_Click(object sender, EventArgs e)
        {
            if (!bRunning)
            {
                value = Convert.ToInt32(StartValBox.Text);
                outCount = 0;
                inCount = 0;

                bRunning = true;
                StartBtn.Text = "Stop";
                StartBtn.BackColor = Color.Pink;

                //creates new thread
                tXfers = new Thread(new ThreadStart(TransfersThread));
                tXfers.IsBackground = true;
                tXfers.Priority = ThreadPriority.Highest;
                //Starts the new thread
                tXfers.Start();
            }
            else
            {
                //Makes the thread stop and aborts the thread
                bRunning = false;
                StartBtn.Text = "Start";
                StartBtn.BackColor = Color.Aquamarine;

                if (tXfers == null) return;

                if (tXfers.IsAlive)
                {
                    tXfers.Abort();
                    tXfers.Join();
                    tXfers = null;
                }
            }
        }


        /* Summary
            This is the call back function for updating the UI(user interface) and is called from TransfersThread.
        */
        public void StatusUpdate()
        {
            BytesOutLabel.Text = outCount.ToString();
            BytesInLabel.Text = inCount.ToString();
            Refresh();

            StartBtn.Text = bRunning ? "Stop" : "Start";
            StartBtn.BackColor = bRunning ? Color.Pink : Color.Aquamarine;
        }




        /* Summary
            This thread is initiated on start button click.Run the thread and executes the transfer and invokes the StatusUpdate to update the UI 
        */
        public void TransfersThread()
        {
            int xferLen = XFERSIZE;

            bool bResult = true;

            // Loop stops if either an IN or OUT transfer fails
            for (; bRunning && bResult; )
            {
                SetOutputData();

                xferLen = XFERSIZE;
                //calls the XferData function for bulk transfer(OUT/IN) in the cyusb.dll
                bResult = outEndpoint.XferData(ref outData, ref xferLen);
                outCount += xferLen;

                if (bResult)
                {
                    //calls the XferData function for bulk transfer(OUT/IN) in the cyusb.dll
                    bResult = inEndpoint.XferData(ref inData, ref xferLen);
                    inCount += xferLen;
                }

                // Call StatusUpdate() in the main thread
                this.Invoke(updateUI);
            }

            bRunning = false;

            // Call StatusUpdate() in the main thread
            this.Invoke(updateUI);
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void StartValBox_TextChanged(object sender, EventArgs e)
        {
            try
            {
                int startValue = Convert.ToInt32(StartValBox.Text);
            }
            catch
            {
                StartValBox.Text = "10";
            }
        }

    }
}