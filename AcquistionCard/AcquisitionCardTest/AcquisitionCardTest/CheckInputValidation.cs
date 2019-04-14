using System.Windows.Forms;

namespace AcquisitionCardTest
{
    partial class Form1
    {
        //检查输入是否合法
        private bool CheckInputValidation()
        {
            if (!uint.TryParse(frequencyInput.Text, out frequency))
            {
                DialogResult dr = MessageBox.Show("Please input right frequency");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!uint.TryParse(durationInput.Text, out duration))
            {
                DialogResult dr = MessageBox.Show("Please input right duration");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!uint.TryParse(rangeInput.Text, out range))
            {
                DialogResult dr = MessageBox.Show("Please input right duration");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!ushort.TryParse(trigThInput.Text, out trigTh))
            {
                DialogResult dr = MessageBox.Show("Please input right trigger volt Threshold");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!ushort.TryParse(chAThInput.Text, out chATh))
            {
                DialogResult dr = MessageBox.Show("Please input right channel A volt Threshold");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!ushort.TryParse(chBThInput.Text, out chBTh))
            {
                DialogResult dr = MessageBox.Show("Please input right channel B volt Threshold");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            if (!ushort.TryParse(chCThInput.Text, out chCTh))
            {
                DialogResult dr = MessageBox.Show("Please input right channel C volt Threshold");
                if (dr == DialogResult.OK)
                {
                    return false;
                }
            }

            float.TryParse(resolutionCombo.SelectedItem.ToString(), out resolution);

            return true;
        }
    }
}