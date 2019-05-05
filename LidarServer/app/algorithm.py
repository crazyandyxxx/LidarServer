import numpy as np
import math

def aerosol_calc(chA,chB,overlapA,overlapB,resolution=15,snrT=2,pblT=0.3,rc=15000,sa=40,waveLen=532,verAngle=90):
    r = np.arange(len(chA))+1
    r = r*resolution
    bn=int(len(chA)*5/6)
    bgA = np.mean(chA[bn:])
    bgB = np.mean(chB[bn:])
    noise = np.std(chA[bn:]+chB[bn:])
    chACutBg = chA-bgA
    chBCutBg = chB-bgB
    snr = (chACutBg+chBCutBg)/noise
    chACutBg = chACutBg/overlapA
    chBCutBg = chBCutBg/overlapB
    dePolar = np.where(chACutBg!=0,chBCutBg/chACutBg,0)
    chAPR2 = chACutBg*r*r/1e6
    chBPR2 = chBCutBg*r*r/1e6 
    chPR2 = chAPR2+chBPR2
    sn0 = int(300/resolution)
    sn1 = int(1000/resolution)
    chMax = chPR2[sn0:sn1].max()
    chPR2N = np.where(snr>snrT,chPR2,chMax/200)
    chPR2N = np.where(chPR2N>0.8*chMax,0.8*chMax,chPR2N)
    pblIndex = np.where(chPR2N<pblT*chMax)[0][0]
    if(pblIndex<sn0):
        pblIndex = sn0
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
    return chAPR2,chBPR2,dePolar,ext_a,pbl