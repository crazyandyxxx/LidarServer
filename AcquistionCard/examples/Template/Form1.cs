using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Text;
using System.Windows.Forms;
using CyUSB;

namespace Template
{
    public partial class Form1 : Form
    {
        USBDeviceList usbDevices;
        CyUSBDevice myDevice; 

        public Form1()
        {
            InitializeComponent();

            usbDevices = new USBDeviceList(CyConst.DEVICES_CYUSB);

            usbDevices.DeviceAttached += new EventHandler(usbDevices_DeviceAttached);
            usbDevices.DeviceRemoved += new EventHandler(usbDevices_DeviceRemoved);

            myDevice = usbDevices[0] as CyUSBDevice;
            if (myDevice != null)
                StatusLabel.Text = myDevice.FriendlyName + " connected.";
        }

        
        /*Summary
         This is the event handler for Device removal 
        */
        void usbDevices_DeviceRemoved(object sender, EventArgs e)
        {
            USBEventArgs usbEvent = e as USBEventArgs;

            StatusLabel.Text = usbEvent.FriendlyName + " removed.";
        }


        /*Summary
         This is the event handler for Device attachment
        */
        void usbDevices_DeviceAttached(object sender, EventArgs e)
        {
            USBEventArgs usbEvent = e as USBEventArgs;

            StatusLabel.Text = usbEvent.Device.FriendlyName + " connected.";
        }

        
        /*Summary
        Executes on closing the form. This method in turn calls the dispose() method to dispose or clear all the resources allocated.
         */
        private void Form1_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (usbDevices != null)
                usbDevices.Dispose();
        }

    }
}