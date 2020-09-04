import numpy as np
import math

def aerosol_calc(chARaw,chBRaw,overlapA,overlapB,frequency,duration,resolution=15,snrT=2,pblT=0.5,rc=15000,sa=40,waveLen=532,verAngle=90,pulsePairRes=20):
    crr = chARaw*pulsePairRes/(frequency*resolution/0.15*duration)
    crr = np.where(crr>0.95,0.95,crr)
    chA = chARaw/(1-crr)
    crr = chBRaw*pulsePairRes/(frequency*resolution/0.15*duration)
    crr = np.where(crr>0.95,0.95,crr)
    chB = chBRaw/(1-crr)
    r = np.arange(len(chA))+1
    r = r*resolution
    bn=int(len(chA)*5/6)
    bgA = np.mean(chA[bn:])
    bgB = np.mean(chB[bn:])
    noise = np.std(chA[bn:]+chB[bn:])
    chACutBg = chA-bgA
    chBCutBg = chB-bgB
    snr = (chACutBg+chBCutBg)/noise if noise>0 else 999
    chACutBg = chACutBg/overlapA
    chBCutBg = chBCutBg/overlapB
    dePolar = np.where(chACutBg!=0,chBCutBg/chACutBg,0)
    chAPR2 = chACutBg*r*r/1e6
    chBPR2 = chBCutBg*r*r/1e6 
    chPR2 = chAPR2+chBPR2
    sn0 = int(300/resolution)
    sn1 = int(3000/resolution)
    chMax = chPR2[sn0:sn1].max()
    chPR2N = np.where(snr>2,chPR2,chMax/200)
    chPR2N = np.where(chPR2N>0.8*chMax,0.8*chMax,chPR2N)
    pblIndexArr = np.where((chPR2N[sn0:]<pblT*chMax)&(chPR2N[sn0:]>chMax/200))[0]+sn0
    pblIndex = sn0
    if(pblIndexArr.size>0):
        if(pblIndexArr[0]>sn0):
            pblIndex = pblIndexArr[0]
    pbl = pblIndex*resolution
    beta_m = 1.54e-3*np.exp(-r*math.sin(verAngle)/7000)*math.pow(532/waveLen,4)
    rcn = int(rc/resolution)
    beta_sf = np.cumsum(beta_m[rcn:])*-1
    beta_sb = np.cumsum(beta_m[:rcn][::-1])[::-1]
    beta_s = np.concatenate((beta_sb,beta_sf))
    sm = 8*math.pi/3
    Xr = chPR2N*np.exp(2*(sa-sm)*resolution*1e-3*beta_s)
    Xrf = np.cumsum(Xr[rcn:])*-1
    Xrb = np.cumsum(Xr[:rcn][::-1])[::-1]
    Xrs = np.concatenate((Xrb,Xrf))*2*sa*resolution*1e-3
    beta = Xr/(10000+Xrs)
    beta_a = beta - beta_m
    ext_a = sa*beta_a
    chA = np.where(snr>snrT,chA,0)
    chB = np.where(snr>snrT,chB,0)
    chAPR2 = np.where(snr>snrT,chAPR2,0)
    chBPR2 = np.where(snr>snrT,chBPR2,0)
    dePolar = np.where(snr>snrT,dePolar,0)
    ext_a = np.where(snr>snrT,ext_a,0)
    return chA,chB,chAPR2,chBPR2,dePolar,ext_a,pbl