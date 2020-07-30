using CyUSB;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;

namespace AcquisitionSocketServer
{
    partial class Program
    {
        //定义采集卡
        static USBDeviceList usbDevices = null;
        static CyControlEndPoint CtrlEndPt = null;
        static CyUSBDevice MyDevice = null;
        static Thread AcquisitionProgressThr;
        //采集参数
        static ushort trigTh = 680, chATh = 680, chBTh = 680, chCTh = 680;     
        static byte[] chA, chB;
        static uint frequency;
        static uint duration;
        static uint accumTimes;
        static ushort binNum = 2000;
        static float resolution = 15;
        static string taskId;
        static int currentAccumNum = 0;
        static float verStartAng = 0, verEndAng = 0, verAngStep = 0, horStartAng = 0, horEndAng = 0, horAngStep = 0;
        static int acquisitionCount = 0;
        static string mode;
        static float currentVerAng = -9999, currentHorAng=-9999;
        static double altitude = -9999, latitude = -9999, longitude = -9999;
        static float inerTemperature = -9999, inerHumidity = -9999;
        static int inerTempeNormal = 1, inerHumiNormal = 1;
        static float envTemperature = -9999, envHumidity = -9999, envPressure = -9999;
        static int realFrequency = -9999, laserRunnedTime = -9999;
        static float laserEnergy = -9999, azimuth = -9999, zenith = -9999;


        private static void SetAcquistionParams(dynamic cmd)
        {
            taskId = (string)cmd.cmdParams.taskId;
            frequency = (uint)cmd.cmdParams.frequency;
            duration = (uint)cmd.cmdParams.duration;
            accumTimes = frequency * duration;
            binNum = (ushort)cmd.cmdParams.binNum;
            resolution = (float)cmd.cmdParams.resolution;
            mode = (string)cmd.cmdParams.mode;
            verStartAng = (float)cmd.cmdParams.verStartAng;
            verEndAng = (float)cmd.cmdParams.verEndAng;
            verAngStep = (float)cmd.cmdParams.verAngStep;
            horStartAng = (float)cmd.cmdParams.horStartAng;
            horEndAng = (float)cmd.cmdParams.horEndAng;
            horAngStep = (float)cmd.cmdParams.horAngStep;
        }
    }
}
