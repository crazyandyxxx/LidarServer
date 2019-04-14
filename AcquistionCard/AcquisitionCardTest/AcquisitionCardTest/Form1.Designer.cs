namespace AcquisitionCardTest
{
    partial class Form1
    {
        /// <summary>
        /// 必需的设计器变量。
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 清理所有正在使用的资源。
        /// </summary>
        /// <param name="disposing">如果应释放托管资源，为 true；否则为 false。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows 窗体设计器生成的代码

        /// <summary>
        /// 设计器支持所需的方法 - 不要
        /// 使用代码编辑器修改此方法的内容。
        /// </summary>
        private void InitializeComponent()
        {
            this.acquisitonProgressBar = new System.Windows.Forms.ProgressBar();
            this.buttonStart = new System.Windows.Forms.Button();
            this.label1Freq = new System.Windows.Forms.Label();
            this.frequencyInput = new System.Windows.Forms.TextBox();
            this.label1Dura = new System.Windows.Forms.Label();
            this.durationInput = new System.Windows.Forms.TextBox();
            this.label1Ran = new System.Windows.Forms.Label();
            this.rangeInput = new System.Windows.Forms.TextBox();
            this.resolutionCombo = new System.Windows.Forms.ComboBox();
            this.freqUnit = new System.Windows.Forms.Label();
            this.durationUnit = new System.Windows.Forms.Label();
            this.rangeUnit = new System.Windows.Forms.Label();
            this.label1 = new System.Windows.Forms.Label();
            this.labelTrigTh = new System.Windows.Forms.Label();
            this.trigThInput = new System.Windows.Forms.TextBox();
            this.label3 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.chAThInput = new System.Windows.Forms.TextBox();
            this.label5 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.chCThInput = new System.Windows.Forms.TextBox();
            this.label6 = new System.Windows.Forms.Label();
            this.label7 = new System.Windows.Forms.Label();
            this.chBThInput = new System.Windows.Forms.TextBox();
            this.label8 = new System.Windows.Forms.Label();
            this.checkBox1 = new System.Windows.Forms.CheckBox();
            this.labelCardStatus = new System.Windows.Forms.Label();
            this.labelCount = new System.Windows.Forms.Label();
            this.listView1 = new System.Windows.Forms.ListView();
            this.SuspendLayout();
            // 
            // acquisitonProgressBar
            // 
            this.acquisitonProgressBar.Location = new System.Drawing.Point(15, 126);
            this.acquisitonProgressBar.Name = "acquisitonProgressBar";
            this.acquisitonProgressBar.Size = new System.Drawing.Size(354, 23);
            this.acquisitonProgressBar.Step = 2;
            this.acquisitonProgressBar.TabIndex = 1;
            // 
            // buttonStart
            // 
            this.buttonStart.Location = new System.Drawing.Point(504, 125);
            this.buttonStart.Name = "buttonStart";
            this.buttonStart.Size = new System.Drawing.Size(94, 23);
            this.buttonStart.TabIndex = 3;
            this.buttonStart.Text = "Start";
            this.buttonStart.UseVisualStyleBackColor = true;
            this.buttonStart.Click += new System.EventHandler(this.buttonStart_Click);
            // 
            // label1Freq
            // 
            this.label1Freq.AutoSize = true;
            this.label1Freq.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1Freq.Location = new System.Drawing.Point(12, 18);
            this.label1Freq.Name = "label1Freq";
            this.label1Freq.Size = new System.Drawing.Size(95, 21);
            this.label1Freq.TabIndex = 4;
            this.label1Freq.Text = "Frequency";
            // 
            // frequencyInput
            // 
            this.frequencyInput.Location = new System.Drawing.Point(82, 17);
            this.frequencyInput.Name = "frequencyInput";
            this.frequencyInput.Size = new System.Drawing.Size(66, 28);
            this.frequencyInput.TabIndex = 5;
            this.frequencyInput.Text = "2500";
            this.frequencyInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label1Dura
            // 
            this.label1Dura.AutoSize = true;
            this.label1Dura.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1Dura.Location = new System.Drawing.Point(186, 18);
            this.label1Dura.Name = "label1Dura";
            this.label1Dura.Size = new System.Drawing.Size(78, 21);
            this.label1Dura.TabIndex = 6;
            this.label1Dura.Text = "Duration";
            // 
            // durationInput
            // 
            this.durationInput.Location = new System.Drawing.Point(246, 17);
            this.durationInput.Name = "durationInput";
            this.durationInput.Size = new System.Drawing.Size(66, 28);
            this.durationInput.TabIndex = 7;
            this.durationInput.Text = "30";
            this.durationInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label1Ran
            // 
            this.label1Ran.AutoSize = true;
            this.label1Ran.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1Ran.Location = new System.Drawing.Point(344, 18);
            this.label1Ran.Name = "label1Ran";
            this.label1Ran.Size = new System.Drawing.Size(63, 21);
            this.label1Ran.TabIndex = 8;
            this.label1Ran.Text = "Range";
            // 
            // rangeInput
            // 
            this.rangeInput.Location = new System.Drawing.Point(394, 17);
            this.rangeInput.Name = "rangeInput";
            this.rangeInput.Size = new System.Drawing.Size(66, 28);
            this.rangeInput.TabIndex = 9;
            this.rangeInput.Text = "30000";
            this.rangeInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // resolutionCombo
            // 
            this.resolutionCombo.FormattingEnabled = true;
            this.resolutionCombo.Items.AddRange(new object[] {
            "5",
            "7.5",
            "15",
            "30"});
            this.resolutionCombo.Location = new System.Drawing.Point(503, 17);
            this.resolutionCombo.Name = "resolutionCombo";
            this.resolutionCombo.Size = new System.Drawing.Size(95, 26);
            this.resolutionCombo.TabIndex = 10;
            // 
            // freqUnit
            // 
            this.freqUnit.AutoSize = true;
            this.freqUnit.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.freqUnit.Location = new System.Drawing.Point(154, 18);
            this.freqUnit.Name = "freqUnit";
            this.freqUnit.Size = new System.Drawing.Size(31, 21);
            this.freqUnit.TabIndex = 11;
            this.freqUnit.Text = "Hz";
            // 
            // durationUnit
            // 
            this.durationUnit.AutoSize = true;
            this.durationUnit.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.durationUnit.Location = new System.Drawing.Point(318, 18);
            this.durationUnit.Name = "durationUnit";
            this.durationUnit.Size = new System.Drawing.Size(19, 21);
            this.durationUnit.TabIndex = 12;
            this.durationUnit.Text = "s";
            // 
            // rangeUnit
            // 
            this.rangeUnit.AutoSize = true;
            this.rangeUnit.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.rangeUnit.Location = new System.Drawing.Point(466, 18);
            this.rangeUnit.Name = "rangeUnit";
            this.rangeUnit.Size = new System.Drawing.Size(24, 21);
            this.rangeUnit.TabIndex = 13;
            this.rangeUnit.Text = "m";
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(604, 18);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(24, 21);
            this.label1.TabIndex = 14;
            this.label1.Text = "m";
            // 
            // labelTrigTh
            // 
            this.labelTrigTh.AutoSize = true;
            this.labelTrigTh.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.labelTrigTh.Location = new System.Drawing.Point(12, 59);
            this.labelTrigTh.Name = "labelTrigTh";
            this.labelTrigTh.Size = new System.Drawing.Size(153, 21);
            this.labelTrigTh.TabIndex = 15;
            this.labelTrigTh.Text = "Trigger Threshold";
            // 
            // trigThInput
            // 
            this.trigThInput.Location = new System.Drawing.Point(143, 59);
            this.trigThInput.Name = "trigThInput";
            this.trigThInput.Size = new System.Drawing.Size(66, 28);
            this.trigThInput.TabIndex = 16;
            this.trigThInput.Text = "680";
            this.trigThInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label3.Location = new System.Drawing.Point(215, 60);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(35, 21);
            this.label3.TabIndex = 18;
            this.label3.Text = "mV";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(470, 60);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(35, 21);
            this.label4.TabIndex = 21;
            this.label4.Text = "mV";
            // 
            // chAThInput
            // 
            this.chAThInput.Location = new System.Drawing.Point(398, 59);
            this.chAThInput.Name = "chAThInput";
            this.chAThInput.Size = new System.Drawing.Size(66, 28);
            this.chAThInput.TabIndex = 20;
            this.chAThInput.Text = "680";
            this.chAThInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label5.Location = new System.Drawing.Point(267, 60);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(177, 21);
            this.label5.TabIndex = 19;
            this.label5.Text = "Channel A Threshold";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label2.Location = new System.Drawing.Point(470, 92);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(35, 21);
            this.label2.TabIndex = 27;
            this.label2.Text = "mV";
            // 
            // chCThInput
            // 
            this.chCThInput.Location = new System.Drawing.Point(398, 91);
            this.chCThInput.Name = "chCThInput";
            this.chCThInput.Size = new System.Drawing.Size(66, 28);
            this.chCThInput.TabIndex = 26;
            this.chCThInput.Text = "680";
            this.chCThInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label6
            // 
            this.label6.AutoSize = true;
            this.label6.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label6.Location = new System.Drawing.Point(267, 93);
            this.label6.Name = "label6";
            this.label6.Size = new System.Drawing.Size(181, 21);
            this.label6.TabIndex = 25;
            this.label6.Text = "Channel C Threshold";
            // 
            // label7
            // 
            this.label7.AutoSize = true;
            this.label7.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label7.Location = new System.Drawing.Point(215, 94);
            this.label7.Name = "label7";
            this.label7.Size = new System.Drawing.Size(35, 21);
            this.label7.TabIndex = 24;
            this.label7.Text = "mV";
            // 
            // chBThInput
            // 
            this.chBThInput.Location = new System.Drawing.Point(143, 93);
            this.chBThInput.Name = "chBThInput";
            this.chBThInput.Size = new System.Drawing.Size(66, 28);
            this.chBThInput.TabIndex = 23;
            this.chBThInput.Text = "680";
            this.chBThInput.TextAlign = System.Windows.Forms.HorizontalAlignment.Right;
            // 
            // label8
            // 
            this.label8.AutoSize = true;
            this.label8.Font = new System.Drawing.Font("Arial", 9F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label8.Location = new System.Drawing.Point(12, 94);
            this.label8.Name = "label8";
            this.label8.Size = new System.Drawing.Size(180, 21);
            this.label8.TabIndex = 22;
            this.label8.Text = "Channel B Threshold";
            // 
            // checkBox1
            // 
            this.checkBox1.AutoSize = true;
            this.checkBox1.Location = new System.Drawing.Point(402, 129);
            this.checkBox1.Name = "checkBox1";
            this.checkBox1.Size = new System.Drawing.Size(142, 22);
            this.checkBox1.TabIndex = 28;
            this.checkBox1.Text = "Continuously";
            this.checkBox1.UseVisualStyleBackColor = true;
            this.checkBox1.CheckedChanged += new System.EventHandler(this.checkBox1_CheckedChanged);
            // 
            // labelCardStatus
            // 
            this.labelCardStatus.AutoSize = true;
            this.labelCardStatus.Location = new System.Drawing.Point(13, 152);
            this.labelCardStatus.Name = "labelCardStatus";
            this.labelCardStatus.Size = new System.Drawing.Size(0, 18);
            this.labelCardStatus.TabIndex = 29;
            this.labelCardStatus.TextAlign = System.Drawing.ContentAlignment.MiddleRight;
            // 
            // labelCount
            // 
            this.labelCount.AutoSize = true;
            this.labelCount.Location = new System.Drawing.Point(271, 152);
            this.labelCount.Name = "labelCount";
            this.labelCount.Size = new System.Drawing.Size(0, 18);
            this.labelCount.TabIndex = 30;
            // 
            // listView1
            // 
            this.listView1.Location = new System.Drawing.Point(38, 187);
            this.listView1.Name = "listView1";
            this.listView1.Size = new System.Drawing.Size(342, 377);
            this.listView1.TabIndex = 31;
            this.listView1.UseCompatibleStateImageBehavior = false;
            // 
            // Form1
            // 
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.None;
            this.ClientSize = new System.Drawing.Size(637, 601);
            this.Controls.Add(this.listView1);
            this.Controls.Add(this.labelCount);
            this.Controls.Add(this.labelCardStatus);
            this.Controls.Add(this.checkBox1);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.chCThInput);
            this.Controls.Add(this.label6);
            this.Controls.Add(this.label7);
            this.Controls.Add(this.chBThInput);
            this.Controls.Add(this.label8);
            this.Controls.Add(this.label4);
            this.Controls.Add(this.chAThInput);
            this.Controls.Add(this.label5);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.trigThInput);
            this.Controls.Add(this.labelTrigTh);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.rangeUnit);
            this.Controls.Add(this.durationUnit);
            this.Controls.Add(this.freqUnit);
            this.Controls.Add(this.resolutionCombo);
            this.Controls.Add(this.rangeInput);
            this.Controls.Add(this.label1Ran);
            this.Controls.Add(this.durationInput);
            this.Controls.Add(this.label1Dura);
            this.Controls.Add(this.frequencyInput);
            this.Controls.Add(this.label1Freq);
            this.Controls.Add(this.buttonStart);
            this.Controls.Add(this.acquisitonProgressBar);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.ProgressBar acquisitonProgressBar;
        private System.Windows.Forms.Button buttonStart;
        private System.Windows.Forms.Label label1Freq;
        private System.Windows.Forms.TextBox frequencyInput;
        private System.Windows.Forms.Label label1Dura;
        private System.Windows.Forms.TextBox durationInput;
        private System.Windows.Forms.Label label1Ran;
        private System.Windows.Forms.TextBox rangeInput;
        private System.Windows.Forms.ComboBox resolutionCombo;
        private System.Windows.Forms.Label freqUnit;
        private System.Windows.Forms.Label durationUnit;
        private System.Windows.Forms.Label rangeUnit;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label labelTrigTh;
        private System.Windows.Forms.TextBox trigThInput;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.TextBox chAThInput;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.TextBox chCThInput;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.TextBox chBThInput;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.CheckBox checkBox1;
        private System.Windows.Forms.Label labelCardStatus;
        private System.Windows.Forms.Label labelCount;
        private System.Windows.Forms.ListView listView1;
    }
}

