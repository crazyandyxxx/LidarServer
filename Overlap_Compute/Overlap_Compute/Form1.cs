using System;
using System.Collections.Generic;
using System.IO;
using System.Windows.Forms;
using MathNet.Numerics.LinearAlgebra.Single;
using MathNet.Numerics.LinearAlgebra.Generic;
using MathNet.Numerics.LinearAlgebra.Generic.Factorization;
//using EV_Lidar_Algorithm;

namespace EV_Lidar_Overlap_Compute
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private int starthI;
        private float[] OverlapA;
        private float[] OverlapB;

        private void button1_Click(object sender, EventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog
            {
                Filter = "A通道数据文件(*.csv)|*.csv"
            };
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                this.textBox1.Text = dialog.FileName;
            }
        }
        private void button2_Click(object sender, EventArgs e)
        {
            OpenFileDialog dialog = new OpenFileDialog
            {
                Filter = "B通道数据文件(*.csv)|*.csv"
            };
            new List<float>();
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                this.textBox2.Text = dialog.FileName;
            }
        }

        private void button3_Click(object sender, EventArgs e)
        {
            SaveFileDialog dialog = new SaveFileDialog
            {
                DefaultExt = "ov",
                Filter = "Overlap文件(*.ov)|*.ov"
            };
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                StreamWriter writer = new StreamWriter(dialog.FileName);
                for (int i = 0; i < OverlapA.Length; i++)
                {
                    writer.WriteLine($"{this.OverlapA[i]} {this.OverlapB[i]}");
                }
                writer.Close();
            }
        }

        private void button4_Click(object sender, EventArgs e)
        {
            if ((((this.textBox1.Text != null) && (this.textBox2.Text != null)) && ((this.textBox4.Text != null) && (this.textBox5.Text != null))) && (((this.textBox6.Text != null) && (this.textBox7.Text != null)) && (this.textBox8.Text != null)))
            {               
                List<float> list = new List<float>();
                List<float> list2 = new List<float>();
 
                this.LoadDataFile(this.textBox1.Text, ref list);
                this.LoadDataFile(this.textBox2.Text, ref list2);
                float realSpatialRes = Convert.ToSingle(this.textBox11.Text);
                float[] chA = list.ToArray();
                float[] chB = list2.ToArray();
                int num = 0;
                float num2 = 0f;
                float num3 = 0f;
                for (int i = chA.Length - 1; i > ((5 * chA.Length) / 6); i--)
                {
                    num2 += chA[i];
                    num3 += chB[i];
                    num++;
                }
                num2 /= (float)num;
                num3 /= (float)num;
                for (int j = 0; j < chA.Length; j++)
                {
                    chA[j] = (chA[j] > num2) ? (chA[j] - num2) : 0f;
                    chB[j] = (chB[j] > num3) ? (chB[j] - num3) : 0f;
                }

                float spatialResolution = Convert.ToSingle(this.textBox11.Text);
                float[] chARes = new float[(int)(30000f / spatialResolution)];
                float[] chBRes = new float[(int)(30000f / spatialResolution)];
                RawDataResize(chA, chB, realSpatialRes, spatialResolution, chARes, chBRes);
                OverlapA = new float[chARes.Length];
                OverlapB = new float[chBRes.Length];

                int num12 = (int)(3000f / spatialResolution);
                float[] numArray = new float[num12];
                float[] numArray2 = new float[num12];
                float[] numArray3 = new float[num12];

                starthI = (int)(Convert.ToSingle(this.textBox8.Text) / spatialResolution);
                for (int k = 0; k < num12; k++)
                {
                    numArray3[k] = spatialResolution * (this.starthI + k) * 0.001f;
                    numArray[k] = (float)Math.Log((double)((chARes[(this.starthI - 1) + k] * numArray3[k]) * numArray3[k]));
                    numArray2[k] = (float)Math.Log((double)((chBRes[(this.starthI - 1) + k] * numArray3[k]) * numArray3[k]));
                }
                float[] storage = numArray3;
                float[] numArray7 = numArray;
                Matrix<float> matrix = Matrix<float>.CreateFromColumns(new DenseVector[] { new DenseVector(storage.Length, 1f), new DenseVector(storage) });
                DenseVector input = new DenseVector(numArray7);
                Vector<float> vector2 = matrix.QR(QRMethod.Full).Solve(input);
                float num7 = vector2[0];
                float num8 = vector2[1];
                storage = numArray3;
                numArray7 = numArray2;
                matrix = Matrix<float>.CreateFromColumns(new DenseVector[] { new DenseVector(storage.Length, 1f), new DenseVector(storage) });
                input = new DenseVector(numArray7);
                vector2 = matrix.QR(QRMethod.Full).Solve(input);
                float num9 = vector2[0];
                float num10 = vector2[1];
             
                float[] numArray8 = new float[num12];              
                for (int m = 0; m < num12; m++)
                {
                    numArray8[m] = (float)Math.Log((double)(((chBRes[(this.starthI - 1) + m] + chARes[(this.starthI - 1) + m]) * numArray3[m]) * numArray3[m]));
                }
                storage = numArray3;
                numArray7 = numArray8;
                matrix = Matrix<float>.CreateFromColumns(new DenseVector[] { new DenseVector(storage.Length, 1f), new DenseVector(storage) });
                input = new DenseVector(numArray7);
                vector2 = matrix.QR(QRMethod.Full).Solve(input);
                float num14 = -vector2[1] / 2f;
                float num15 = (float)Math.Exp((double)vector2[0]);

                for (int n = 0; n < (this.starthI - 1); n++)
                {
                    this.OverlapA[n] = (chARes[n] <= 0f) ? 1f : ((float)((((chARes[n] * (n + 1)) * (n + 1)) * spatialResolution * spatialResolution * 1e-6) / (Math.Exp((double)num7) * Math.Exp((num8 * (n + 1)) * spatialResolution * 1e-3))));
                    this.OverlapB[n] = (chBRes[n] <= 0f) ? 1f : ((float)((((chBRes[n] * (n + 1)) * (n + 1)) * spatialResolution * spatialResolution * 1e-6) / (Math.Exp((double)num9) * Math.Exp((num10 * (n + 1)) * spatialResolution * 1e-3))));
                }
                for (int num17 = this.starthI - 1; num17 < OverlapA.Length; num17++)
                {
                    this.OverlapA[num17] = 1f;
                    this.OverlapB[num17] = 1f;
                }

                this.chart1.Series["Series1"].Points.Clear();
                this.chart1.Series["Series2"].Points.Clear();
                this.chart1.Series["Series3"].Points.Clear();
                this.chart1.Series["Series4"].Points.Clear();
                for (int num18 = 0; num18 < (6000f / spatialResolution); num18++)
                {
                    this.chart1.Series["Series1"].Points.AddXY(spatialResolution * 1e-3 * (num18 + 1), (chARes[num18] > 0f) ? Math.Log(((chARes[num18] * (num18 + 1)) * (num18 + 1)) * spatialResolution * spatialResolution * 1e-6) : 0.0);
                    this.chart1.Series["Series2"].Points.AddXY(spatialResolution * 1e-3 * (num18 + 1), (chBRes[num18] > 0f) ? Math.Log(((chBRes[num18] * (num18 + 1)) * (num18 + 1)) * spatialResolution * spatialResolution * 1e-6) : 0.0);
                    this.chart1.Series["Series3"].Points.AddXY((double)(spatialResolution * 1e-3 * (num18 + 1)), (double)(num7 + ((num8 * spatialResolution * 1e-3) * (num18 + 1))));
                    this.chart1.Series["Series4"].Points.AddXY((double)(spatialResolution * 1e-3 * (num18 + 1)), (double)(num9 + ((num10 * spatialResolution * 1e-3) * (num18 + 1))));
                }
                this.textBox4.Text = num7.ToString();
                this.textBox5.Text = num8.ToString();
                this.textBox6.Text = num9.ToString();
                this.textBox7.Text = num10.ToString();
                this.textBox9.Text = num14.ToString();
                this.textBox10.Text = num15.ToString();

                for (int num19 = 0; num19 < chARes.Length; num19++)
                {
                    chARes[num19] /= this.OverlapA[num19];
                    chBRes[num19] /= this.OverlapB[num19];
                }

                float[] numArray12 = new float[(int)(30000f / spatialResolution)];
                float num20 = 0f;
                for (int num22 = 0; num22 < (30000f / spatialResolution); num22++)
                {
                    float num21 = (((((chARes[num22] + chBRes[num22]) * (num22 + 1)) * (num22 + 1)) * spatialResolution) * spatialResolution) * 1E-06f;
                    num20 += num21;
                    numArray12[num22] = num21 / ((num15 / num14) - (((2f * num20) * spatialResolution) * 0.001f));
                    if (numArray12[num22] < 0f)
                    {
                        numArray12[num22] = 0f;
                        break;
                    }
                }
                float[] extCoeff = new float[(int)(30000f / spatialResolution)];
                float[] backCoeff = new float[(int)(30000f / spatialResolution)];
                float sa = 1f;
                for (int num24 = 0; num24 < 0x3e8; num24++)
                {
                    this.KlettMethod(spatialResolution, 6000f, 5000f, sa, chARes, chBRes, extCoeff, backCoeff);
                    if (((extCoeff[3] / num14) > 0.99) && ((extCoeff[3] / num14) < 1.01))
                    {
                        break;
                    }
                    sa *= num14 / extCoeff[3];
                }
                float[] numArray15 = new float[(int)(30000f / spatialResolution)];
                float[] numArray16 = new float[(int)(30000f / spatialResolution)];
                float[] sNR = new float[(int)(30000f / spatialResolution)];
                float[] aerosolBackCoeff = new float[(int)(30000f / spatialResolution)];
                float[] aerosolExtCoeff = new float[(int)(30000f / spatialResolution)];
                float num25 = 1f;
                float num26 = 0f;
                //Algorithm algorithm = new Algorithm();
                for (int num27 = 0; num27 < 0x3e8; num27++)
                {
                    //algorithm.Calculate(spatialResolution, 0f, 532f, 0f, 6000f, 5000f, num25, -1f, chARes, chBRes, sNR, numArray15, aerosolExtCoeff, numArray16, aerosolBackCoeff, out num26, 0f, 0f);
                    if (((numArray15[3] / num14) > 0.99) && ((numArray15[3] / num14) < 1.01))
                    {
                        break;
                    }
                    num25 *= num14 / numArray15[3];
                }
                float[] numArray20 = new float[(int)(30000f / spatialResolution)];
                float[] numArray21 = new float[(int)(30000f / spatialResolution)];
                float[] numArray22 = new float[(int)(30000f / spatialResolution)];
                float[] numArray23 = new float[(int)(30000f / spatialResolution)];
                //algorithm.Calculate(spatialResolution, 0f, 532f, 0f, 6000f, 5000f, sa, -1f, chARes, chBRes, sNR, numArray20, numArray23, numArray21, numArray22, out num26, num15 / backCoeff[0], 0f);
                this.textBox12.Text = sa.ToString();
                this.textBox13.Text = ((num15 / backCoeff[3]) / Convert.ToSingle(this.textBox14.Text)).ToString();
                this.chart2.Series["Series1"].Points.Clear();
                this.chart2.Series["Series2"].Points.Clear();
                this.chart2.Series["Series3"].Points.Clear();
                this.chart2.Series["Series4"].Points.Clear();
                for (int num28 = 0; num28 < (6000f / spatialResolution); num28++)
                {
                    this.chart2.Series["Series1"].Points.AddXY((double)((spatialResolution * 0.001f) * (num28 + 1)), (double)extCoeff[num28]);
                    this.chart2.Series["Series2"].Points.AddXY((double)((spatialResolution * 0.001f) * (num28 + 1)), (double)numArray15[num28]);
                    this.chart2.Series["Series3"].Points.AddXY((double)((spatialResolution * 0.001f) * (num28 + 1)), (double)numArray20[num28]);
                }
            }
        }

        private void button5_Click(object sender, EventArgs e)
        {
            SaveFileDialog dialog = new SaveFileDialog
            {
                DefaultExt = "jpg",
                Filter = "图片文件(*.jpg)|*.jpg"
            };
            if (dialog.ShowDialog() == DialogResult.OK)
            {
                this.chart1.SaveImage(dialog.FileName, System.Windows.Forms.DataVisualization.Charting.ChartImageFormat.Jpeg);
            }
        }

        private void LoadDataFile(string fileName, ref List<float> _lstData)
        {
            try
            {
                StreamReader reader = new StreamReader(fileName);
                _lstData.Clear();
                string str = null;
                char[] separator = new char[] { ',' };
                float result = 0f;
                while ((str = reader.ReadLine()) != null)
                {
                    string[] strArray = str.Split(separator, StringSplitOptions.RemoveEmptyEntries);
                    for(int i = 0;i<strArray.Length;i++)
                    {
                        if (float.TryParse(strArray[i], out result))
                        {
                            if(_lstData.Count<strArray.Length)
                            {
                                _lstData.Add(result);
                            }
                            else
                            {
                                _lstData[i] += result;
                            }                       
                        }
                    }
                    

                }
                reader.Close();
            }
            catch (Exception exception)
            {
                MessageBox.Show($"加载数据文件失败,{exception.Message}");
            }
        }

        private void RawDataResize(float[] ChA, float[] ChB, float SpatialResolution, float VisualSpatialResolution, float[] ChARes, float[] ChBRes)
        {
            float Increment = VisualSpatialResolution / SpatialResolution;
            float EndL = Increment, Plef = 1;
            int Start = 0, End, Ix = 0;

            while (EndL < ChA.Length + 0.0001)
            {
                ChARes[Ix] = 0;
                ChBRes[Ix] = 0;
                End = (int)Math.Floor(EndL);
                for (int i = Start; i < End; i++)
                {
                    ChARes[Ix] += ChA[i];
                    ChBRes[Ix] += ChB[i];
                }
                if (End < ChA.Length)
                {
                    ChARes[Ix] += (EndL - End) * ChA[End];
                    ChBRes[Ix] += (EndL - End) * ChB[End];
                }
                if (Start == -1) Start = 0;
                if(Plef>1e-20)
                {
                    ChARes[Ix] += (1 - Plef) * ChA[Start];
                    ChBRes[Ix] += (1 - Plef) * ChB[Start];
                }              
                Start = End;
                Plef = EndL - End;
                EndL += Increment;
                Ix += 1;
            }
        }

        private void KlettMethod(float SpatialResolution, float Zmax, float Zmin, float Sa, float[] ChA, float[] ChB, float[] ExtCoeff, float[] BackCoeff)
        {
            int length = ChA.Length;
            int index = ((int)(Zmin / SpatialResolution)) - 1;
            if (index < 0)
            {
                index = 0;
            }
            float num3 = 0.00154f;
            float num4 = 0f;
            int num5 = 0;
            for (int i = ((index - 5) < 0) ? 0 : (index - 5); i < (((index + 5) > length) ? length : (index + 5)); i++)
            {
                num4 += ((ChA[i] + ChB[i]) * (i + 1)) * (i + 1);
                num5++;
            }
            num4 = (num4 / num3) / ((float)num5);
            for (int j = index + 1; j < (((Zmax / SpatialResolution) > length) ? ((float)length) : (Zmax / SpatialResolution)); j++)
            {
                float num8 = 0.00154f;
                float num9 = 0f;
                int num10 = 0;
                for (int m = ((j - 5) < 0) ? 0 : (j - 5); m < (((j + 5) > length) ? length : (j + 5)); m++)
                {
                    num9 += ((ChA[m] + ChB[m]) * (m + 1)) * (m + 1);
                    num10++;
                }
                num9 = (num9 / num8) / ((float)num10);
                if (num9 < num4)
                {
                    index = j;
                    num3 = num8;
                    num4 = num9;
                }
            }
            BackCoeff[index] = num3;
            float num12 = num4 * num3;
            ExtCoeff[index] = Sa * BackCoeff[index];
            float num13 = num12;
            num13 = num12;
            for (int k = index - 1; k >= 0; k--)
            {
                float num14 = ((ChA[k] + ChB[k]) * (k + 1)) * (k + 1);
                float num15 = (num13 / BackCoeff[k + 1]) + (((Sa * SpatialResolution) * 0.001f) * (num13 + num14));
                BackCoeff[k] = (num15 <= 0f) ? 0f : (num14 / num15);
                ExtCoeff[k] = Sa * BackCoeff[k];
                num13 = num14;
            }
        }

    }
}
