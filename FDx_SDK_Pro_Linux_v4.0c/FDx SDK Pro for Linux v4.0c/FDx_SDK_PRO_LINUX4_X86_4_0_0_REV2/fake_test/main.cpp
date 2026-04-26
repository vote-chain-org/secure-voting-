/*************************************************************
 *
 * Author :      SecuGen Corporation
 * Description : Fake Test main.cpp source code module
 * Copyright(c): 2020 SecuGen Corporation, All rights reserved
 * History :
 * date        person   comments
 * ======================================================
 * 1/20/2020   driley   Initial release
 *
 *************************************************************/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "sgfplib.h"

#define GET_FAKE_ENGINE_READY				203	// non-zero if ready
#define GET_FAKE_NUM_OF_THRESHOLD		204	// the number of thresholds avaiable
#define GET_FAKE_THRESHOLD					205	// get current threshold index
#define SET_FAKE_THRESHOLD					206   // set new threshold index
#define GET_FAKE_THRESHOLD_VALUE		207	// get current threshold value in double
#define GET_FAKE_SCORE						  208	// get score
#define GET_FAKE_DEFAULT_THRESHOLD	211		// get default threshold index


LPSGFPM  sgfplib = NULL;
double m_ThresholdValue[11];

void print_threshold_table(int numThresholds)
{
    printf ("Threshold\tTouch Chip\tLive Finger\n");
    printf ("Value\t\tEnabled\t\tScore\n");
    printf ("-------------------------------------------\n");

    char touchChip[4];

    for (int i= 0; i<numThresholds; ++i )
    {
         m_ThresholdValue[i] = -1;

       //double threshold;
       int err = sgfplib->SetFakeDetectionLevel(i);
       err = sgfplib->SetGetData(GET_FAKE_THRESHOLD_VALUE,&m_ThresholdValue[i]);

       if (i==0)
         strcpy(touchChip,"NO");
       else
         strcpy(touchChip,"YES");

       printf("%d\t\t%s\t\t%4.0f\n",i,touchChip,m_ThresholdValue[i]);
    }
    printf ("-------------------------------------------\n");
}

// ---------------------------------------------------------------- main() ---
int main(int argc, char **argv)
{

  long err;
  DWORD templateSize, templateSizeMax;
  DWORD quality;
  char function[100];
  char kbBuffer[100];
  char kbWhichFinger[100];
  int fingerLength = 0;
  char *finger;
  BYTE *imageBuffer1;
  FILE *fp = NULL;
  SGDeviceInfoParam deviceInfo;

  for (int i=0; i < 100; ++i)
     kbWhichFinger[i] = 0x00;

  printf("\n-------------------------------------\n");
  printf(  "SecuGen Fake Finger Test\n");
  printf(  "-------------------------------------\n");

  ///////////////////////////////////////////////
  // Instantiate SGFPLib object
  strcpy(function,"CreateSGFPMObject()");
  printf("\nCall %s\n",function);
  err = CreateSGFPMObject(&sgfplib);
  if (!sgfplib)
  {
    printf("ERROR - Unable to instantiate FPM object.\n\n");
    return false;
  }
  printf("%s returned: %ld\n",function,err);

  ///////////////////////////////////////////////
  // Init()
  strcpy(function,"Init(SG_DEV_AUTO)");
  printf("\nCall %s\n",function);
  err = sgfplib->Init(SG_DEV_AUTO);
  printf("%s returned: %ld\n",function,err);

  if (err != SGFDX_ERROR_NONE)
  {
     printf("ERROR - Unable to initialize device.\n\n");
     return 0;
  }


  ///////////////////////////////////////////////
  // OpenDevice()
  strcpy(function,"OpenDevice(0)");
  printf("\nCall %s\n",function);
  err = sgfplib->OpenDevice(0);
  printf("%s returned: %ld\n",function,err);

  if (err == SGFDX_ERROR_NONE)
  {

    ///////////////////////////////////////////////
    // getDeviceInfo()
    deviceInfo.DeviceID = 0;
    strcpy(function,"GetDeviceInfo()");
    printf("\nCall %s\n",function);
    err = sgfplib->GetDeviceInfo(&deviceInfo);
    printf("%s returned: %ld\n",function,err);
    if (err == SGFDX_ERROR_NONE)
    {
      printf("\tdeviceInfo.DeviceID   : %ld\n", deviceInfo.DeviceID);
      printf("\tdeviceInfo.DeviceSN   : %s\n",  deviceInfo.DeviceSN);
      printf("\tdeviceInfo.ComPort    : %ld\n", deviceInfo.ComPort);
      printf("\tdeviceInfo.ComSpeed   : %ld\n", deviceInfo.ComSpeed);
      printf("\tdeviceInfo.ImageWidth : %ld\n", deviceInfo.ImageWidth);
      printf("\tdeviceInfo.ImageHeight: %ld\n", deviceInfo.ImageHeight);
      printf("\tdeviceInfo.Contrast   : %ld\n", deviceInfo.Contrast);
      printf("\tdeviceInfo.Brightness : %ld\n", deviceInfo.Brightness);
      printf("\tdeviceInfo.Gain       : %ld\n", deviceInfo.Gain);
      printf("\tdeviceInfo.ImageDPI   : %ld\n", deviceInfo.ImageDPI);
      printf("\tdeviceInfo.FWVersion  : %04X\n", (unsigned int) deviceInfo.FWVersion);
    }
    printf("\n");

    DWORD setGetDataResult;
    DWORD numThresholds;
    DWORD defaultThreshold;
    double threshold;
    bool bFakeDetectionEngineEnabled = false;

    //////////////////////////////////////////////////////////////////////////
    // Determine if Fake Engine is enabled for this device
    printf("Call SetGetData(GET_FAKE_ENGINE_READY)\n");
    err = sgfplib->SetGetData(GET_FAKE_ENGINE_READY,&setGetDataResult);
    printf("\tReturned:[%ld]\n",err);
    if (setGetDataResult != 1)
    {
        printf("\tFAKE DETECTION ENGINE IS DISABLED.\n\n");
        numThresholds = 2;
    }
    else
    {
        printf("\tFAKE DETECTION ENGINE IS ENABLED.\n\n");
        bFakeDetectionEngineEnabled = true;

        //////////////////////////////////////////////////////////////////////////
        // Get number of fake finger thresholds
        printf("Call SetGetData(GET_FAKE_NUM_OF_THRESHOLD)\n");
        err = sgfplib->SetGetData(GET_FAKE_NUM_OF_THRESHOLD,&numThresholds);
        printf("\tReturned:[%ld]\n",err);
        printf("\tNUMBER OF THRESHOLDS:[%ld]\n\n",numThresholds);

        //////////////////////////////////////////////////////////////////////////
        // Get the default threshold
        printf("Calling SetGetData(GET_FAKE_DEFAULT_THRESHOLD)\n");
        err = sgfplib->SetGetData(GET_FAKE_DEFAULT_THRESHOLD,&defaultThreshold);
        printf("\tReturned:[%ld]\n",err);
        printf("\tDEFAULT THRESHOLD:[%ld]\n\n",defaultThreshold);

    }

    print_threshold_table(numThresholds);



    ///////////////////////////////////////////////
    ///////////////////////////////////////////////
    printf("Fingerprint Sensor LEDS should now be off.\n");
    printf("The FAKE tests will require multiple captures of the same finger at different fake thresholds.\n");
    printf("Enter finger type (e.g. LIVE,SILICON,LATEX,PAPER) >> ");
    fgets(kbWhichFinger,100,stdin);
    //Remove CR/NL (<ENTER>)
    fingerLength = strlen(kbWhichFinger);
    for (int i=0; i < strlen(kbWhichFinger); ++i)
    {
      if ((kbWhichFinger[i] == 0x0A) || (kbWhichFinger[i] == 0x0D)|| (kbWhichFinger[i] == 0x00))
      {
        fingerLength = i;
        break;
      }
    }
    if (fingerLength > 0)
    {
      finger = (char*) malloc(fingerLength + 1);
      strncpy(finger,kbWhichFinger,fingerLength);
      finger[fingerLength] = 0x00;
    }
    else
    {
      finger = (char*) malloc (7);
      strcpy(finger,"LIVE");
    }

    imageBuffer1 = (BYTE*) malloc(deviceInfo.ImageHeight*deviceInfo.ImageWidth);
    for (DWORD i=0; i<numThresholds; ++i)
    {

    printf("\n-----------------------------------------------------\n");

        ///////////////////////////////////////////////
        // getImage() - 1st Capture
        printf("Please place [%s] on sensor and press <ENTER> ",finger);
        getc(stdin);

        printf("Call SetFakeDetectionLevel(%ld)\n",i);
        err = sgfplib->SetFakeDetectionLevel(i);
        printf("\tReturned:[%ld] FAKE_THRESHOLD[%ld]\n",err,i);

        //////////////////////////////////////////////////////////////////////////
        // SetGetData()
        printf("Call SetGetData(GET_FAKE_THRESHOLD_VALUE)\n");
        err = sgfplib->SetGetData(GET_FAKE_THRESHOLD_VALUE,&threshold);
        printf("\tReturned:[%ld] THRESHOLD_VALUE:[%f]\n",err,threshold);

        strcpy(function,"GetImage()");
        printf("Call %s\n",function);
        err = sgfplib->GetImage(imageBuffer1);
        //err = sgfplib->GetImageEx(imageBuffer1,50,NULL,5000);
        printf("\tGetImage() Returned: %ld\n",err);
        double score;
        if (err == SGFDX_ERROR_NONE)
        {

            //////////////////////////////////////////////////////////////////////////
            // SetGetData()
            if (threshold >1)
            {
                printf("Call SetGetData(GET_FAKE_SCORE)\n");
                int result2 = sgfplib->SetGetData(GET_FAKE_SCORE,&score);

                sprintf(kbBuffer,"%s_%ld_%ldx%ld_score_%ld.raw", finger, i, deviceInfo.ImageWidth, deviceInfo.ImageHeight, (long)score);
                fp = fopen(kbBuffer,"wb");
                fwrite (imageBuffer1 , sizeof (BYTE) , deviceInfo.ImageWidth*deviceInfo.ImageHeight , fp);
                fclose(fp);


                char logfilename[3];
                logfilename[0] = deviceInfo.DeviceSN[0];
                logfilename[1] = deviceInfo.DeviceSN[1];
                sprintf(kbBuffer,"%s.csv", logfilename);
                fp = fopen(kbBuffer,"a+");
                fprintf(fp,"%s,%ld\n", finger, (long)score);
                fclose(fp);


                printf("\tReturned:[%d] FAKE_SCORE[%f]\n",result2,score);
                if (score >= threshold)
                    printf("LIVE FINGER DETECTED\n");
                else
                    printf("FAKE FINGER DETECTED\n");
            }
        }
        else if (err == SGFDX_ERROR_WRONG_IMAGE )
           printf("NO FINGER DETECTED\n");
        else
        {
            printf("FAKE FINGER DETECTED\n");
            printf("Call SetGetData(GET_FAKE_SCORE)\n");
            int result2 = sgfplib->SetGetData(GET_FAKE_SCORE,&score);
            printf("\tReturned:[%d] FAKE_SCORE[%f]\n",result2,score);
        }
    }

    printf("\n-----------------------------------------------------\n");

    ///////////////////////////////////////////////
    // closeDevice()
    printf("\nCall CloseDevice()\n");
    err = sgfplib->CloseDevice();
    printf("CloseDevice returned : [%ld]\n",err);

    ///////////////////////////////////////////////
    // Destroy SGFPLib object
    strcpy(function,"DestroySGFPMObject()");
    printf("\nCall %s\n",function);
    err = DestroySGFPMObject(sgfplib);
    printf("%s returned: %ld\n",function,err);

    free(imageBuffer1);
    free(finger);
    imageBuffer1 = NULL;
    finger = NULL;
  }
  return 0;
}
