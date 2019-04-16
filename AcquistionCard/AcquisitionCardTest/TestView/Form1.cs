using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SQLite;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;

namespace TestView
{
    public partial class Form1 : Form
    {
        string path = @"C:\Server\LidarServer\app.db";
        public Form1()
        {
            InitializeComponent();
        }

        private void button1_Click(object sender, EventArgs e)
        {
            SQLiteConnection cn = new SQLiteConnection("data source=" + path);
            List<DateTime> ldt = new List<DateTime>();
            List<float[]> lchA = new List<float[]>();
            List<float[]> lchB = new List<float[]>();
            string s = " ";
            if (cn.State != System.Data.ConnectionState.Open)
            {
                cn.Open();
                SQLiteCommand cmd = new SQLiteCommand();
                cmd.Connection = cn;
                s = textBox1.Text;
                cmd.CommandText = "SELECT timestamp,raw_A,raw_B FROM task_data WHERE task_id=@id";
                cmd.Parameters.Add("id", DbType.String).Value = s;
                SQLiteDataReader sr = cmd.ExecuteReader();
                while (sr.Read())
                {
                    ldt.Add(sr.GetDateTime(0));
                    var chAB = GetBytes(sr, 1);
                    var chBB = GetBytes(sr, 2);
                    lchA.Add(Getfloats(chAB));
                    lchB.Add(Getfloats(chBB));
                }
                sr.Close();
            }
            cn.Close();

            EVRadarView.Algorithm.Algorithm algo = new EVRadarView.Algorithm.Algorithm();
            var dataL = lchA[0].Length;
            var chACutBgnR = new float[dataL];
            var chBCutBgnR = new float[dataL];
            var chACutBgn = new float[dataL];
            var chBCutBgn = new float[dataL];
            var chAPRR = new float[dataL];
            var chBPRR = new float[dataL];
            float noise = 0, aod=0;
            int pbl0 = 0, pbl1=0;
            var snr = new float[dataL];
            var tpb = new float[dataL];
            var cldB = new float[4];
            var cldT = new float[4];
            var sa = new float[dataL];
            for(int i=0;i<dataL;i++)
                sa[i] = 40;
            var ext = new float[dataL];
            var bac = new float[dataL];
            var aeroExt = new float[dataL];
            var aeroBac = new float[dataL];
            var swPRR = new StreamWriter(@"c:\server\test\CHAPRR" + s + ".txt");
            var swExt = new StreamWriter(@"c:\server\test\Ext" + s + ".txt");
            var swTPB = new StreamWriter(@"c:\server\test\TPB" + s + ".txt");
            var swSNR = new StreamWriter(@"c:\server\test\SNR" + s + ".txt");
            var bmpPRR = new Bitmap(lchA.Count, dataL / 2);
            var bmpExt = new Bitmap(lchA.Count, dataL / 2);
            var bmpBac = new Bitmap(lchA.Count, dataL / 2);
            var bmpSNR = new Bitmap(lchA.Count, dataL / 2);
            for(int i=0;i<lchA.Count;i++)
            {
                algo.SignalProcess(lchA[i], lchB[i], 1, null, null, 1, 1, chACutBgnR, chBCutBgnR, out noise);
                algo.SignalAnalysis(chACutBgnR, chBCutBgnR, null, null, noise, 15, 15, 2, 0.3f, chACutBgn, chBCutBgn, chAPRR, chBPRR, snr, tpb, out pbl0, out pbl1, cldB, cldT);
                algo.Calculate(15, 90, 532, 0, 20000, 18000, sa, 2, chACutBgn, chBCutBgn, snr, ext, aeroExt, bac, aeroBac, out aod);

                string sl = "";
                foreach (var ss in chAPRR)
                    sl += ss.ToString("f2")+"  ";
                swPRR.WriteLine(sl);

                sl = "";
                foreach (var ss in ext)
                    sl += ss.ToString("f2") + "  ";
                swExt.WriteLine(sl);

                sl = "";
                foreach (var ss in tpb)
                    sl += ss.ToString("f2") + "  ";
                swTPB.WriteLine(sl);

                sl = "";
                foreach (var ss in snr)
                    sl += ss.ToString("f2") + "  ";
                swSNR.WriteLine(sl);

                for (int j = dataL / 2-1; j >= 0; j--)
                {
                    var cln = (int)(chAPRR[j] / 100000 * 255) > 255 ? 255 : (int)(chAPRR[j] / 100000 * 255);
                    Color c = Color.FromArgb(cln, cln, cln);
                    bmpPRR.SetPixel(i, j, c);
                }
            }
            swPRR.Flush();
            swPRR.Close();
            swExt.Flush();
            swExt.Close();
            swTPB.Flush();
            swTPB.Close();
            swSNR.Flush();
            swSNR.Close();

            bmpPRR.Save(@"c:\server\test\CHAPRR" + s + ".jpg", System.Drawing.Imaging.ImageFormat.Jpeg);   
            bmpPRR.Dispose();
            MessageBox.Show("complete");
        }

        static byte[] GetBytes(SQLiteDataReader reader, int ind)
        {
            const int CHUNK_SIZE = 2 * 1024;
            byte[] buffer = new byte[CHUNK_SIZE];
            long bytesRead;
            long fieldOffset = 0;
            using (MemoryStream stream = new MemoryStream())
            {
                while ((bytesRead = reader.GetBytes(ind, fieldOffset, buffer, 0, buffer.Length)) > 0)
                {
                    stream.Write(buffer, 0, (int)bytesRead);
                    fieldOffset += bytesRead;
                }
                return stream.ToArray();
            }
        }

        static float[] Getfloats(byte[] OA)
        {
            var flts = new float[OA.Length / 4];
            for (int i = 0; i < flts.Length; i++)
            {
                flts[i] = BitConverter.ToInt32(OA, i * 4);
            }
            return flts;
        }
    }
}
