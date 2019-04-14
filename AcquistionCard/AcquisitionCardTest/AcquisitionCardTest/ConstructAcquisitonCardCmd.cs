using System;
namespace AcquisitionCardTest
{
    partial class Form1
    {
        private void ConstructAcquisitionStartCmd()
        {
            accumTimes = frequency * duration;
            byte[] accumTimesBytes = BitConverter.GetBytes(accumTimes);

            binNum = (ushort)(range / resolution);
            byte[] binNumBytes = BitConverter.GetBytes(binNum);

            acquisitionStartCmd[0] = 0xC0;
            Array.Copy(accumTimesBytes, 0, acquisitionStartCmd, 1, 4);
            Array.Copy(binNumBytes, 0, acquisitionStartCmd, 5, 2);

            byte resolutionByte = 0xcc;
            if (resolution == 5)
                resolutionByte = 0xaa;
            else if (resolution == 7.5f)
                resolutionByte = 0xbb;
            else if (resolution == 15)
                resolutionByte = 0xcc;
            else if (resolution == 30)
                resolutionByte = 0xdd;
            acquisitionStartCmd[7] = resolutionByte;

            byte[] trigThBytes = BitConverter.GetBytes(trigTh);
            byte[] chAThBytes = BitConverter.GetBytes(chATh);
            byte[] chBThBytes = BitConverter.GetBytes(chBTh);
            byte[] chCThBytes = BitConverter.GetBytes(chCTh);
            Array.Copy(trigThBytes, 0, acquisitionStartCmd, 8, 2);
            Array.Copy(chAThBytes, 0, acquisitionStartCmd, 10, 2);
            Array.Copy(chBThBytes, 0, acquisitionStartCmd, 12, 2);
            Array.Copy(chCThBytes, 0, acquisitionStartCmd, 14, 2);
            acquisitionStartCmd[16] = 0xff;
        }
    }
}