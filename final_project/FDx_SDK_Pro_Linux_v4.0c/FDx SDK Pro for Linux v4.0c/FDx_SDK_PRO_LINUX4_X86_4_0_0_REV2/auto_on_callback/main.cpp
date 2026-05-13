/*************************************************************
 *
 * Author :      SecuGen Corporation
 * Description : Auto On  main.cpp source code module
 * Copyright(c): 2009 SecuGen Corporation, All rights reserved
 * History :
 * date        person   comments
 * ======================================================
 *
 *
 *************************************************************/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include "sgfplib.h"
#include <unistd.h>


LPSGFPM  sgfplib = NULL;
bool fingerPresent= false;

///////////////////////////////////////////////////////////////////////////
//AUTO ON CALLBACK FUNCTION
DWORD WINAPI callback_function_auto_on(void* user_data, void* devInfo2) {
	SGDeviceInfoParam *info2 = (SGDeviceInfoParam*)devInfo2;

	if (info2) {
     fingerPresent = true;
      printf("FINGER ON\n");
      printf("\tDeviceID   : %ld\n", info2->DeviceID);
      printf("\tDeviceSN   : %s\n",  info2->DeviceSN);
      printf("\tComPort    : %ld\n", info2->ComPort);
      printf("\tComSpeed   : %ld\n", info2->ComSpeed);
      printf("\tImageWidth : %ld\n", info2->ImageWidth);
      printf("\tImageHeight: %ld\n", info2->ImageHeight);
      printf("\tContrast   : %ld\n", info2->Contrast);
      printf("\tBrightness : %ld\n", info2->Brightness);
      printf("\tGain       : %ld\n", info2->Gain);
      printf("\tImageDPI   : %ld\n", info2->ImageDPI);
      printf("\tFWVersion  : %04X\n", (unsigned int) info2->FWVersion);
	} else {
		// touch-off
		//msg << "OFF:---";
      printf("OFF\n");
      fingerPresent = false;
	}
}

///////////////////////////////////////////////////////////////////////////
//START AUTO ON
// EnableAutoOnEvent(true,NULL,NULL)
 bool StartAutoOn(LPSGFPM m_sgfplib)
{
  DWORD result;
  bool StartAutoOn = false;
  fingerPresent = false;

  // Enable AutoOn Event using callback (param2 = NULL)
  printf("Calling EnableAutoOnEvent(true,NULL,NULL) ... \n");  
  result = m_sgfplib->EnableAutoOnEvent(true,NULL,NULL);
  printf("\treturned ");  
  if (result == SGFDX_ERROR_NONE)
     StartAutoOn = true;
  return StartAutoOn;
}

///////////////////////////////////////////////////////////////////////////
//STOP AUTO ON
//EnableAutoOnEvent(false,NULL,NULL)
bool StopAutoOn(LPSGFPM m_sgfplib)
{
  DWORD result;
  bool StopAutoOn = false;
  //////////////////////////////////////////////////////////////////////////
  // Disable AutoOn Event using callback (param2 = NULL)
  result = m_sgfplib->EnableAutoOnEvent(false,NULL,NULL);
  if (result == SGFDX_ERROR_NONE)
     StopAutoOn = true;
  return StopAutoOn;
}

// ---------------------------------------------------------------- main() ---
int main(int argc, char **argv)
{

     long err;
     BYTE* imageBuffer1;
     int   msg_qid;
     SGDeviceInfoParam deviceInfo;


     printf("\n------------------------------------------\n");
     printf(  "SecuGen Auto-On Callback Function Test\n");
     printf(  "------------------------------------------\n");

     ///////////////////////////////////////////////
     // Instantiate SGFPLib object
     err = CreateSGFPMObject(&sgfplib);
     if (!sgfplib)
     {
     	printf("ERROR - Unable to instantiate FPM object\n");
     	return -1;
     }
     printf("CreateSGFPMObject returned: %ld\n",err);


     if (err == SGFDX_ERROR_NONE)
     {

         ///////////////////////////////////////////////
         // Init()
         printf("Call sgfplib->Init(SG_DEV_AUTO)\n");
         err = sgfplib->Init(SG_DEV_AUTO);
         printf("Init returned: %ld\n",err);

         ///////////////////////////////////////////////
         // OpenDevice()
         printf("Call sgfplib->OpenDevice(0)\n");
         err = sgfplib->OpenDevice(0);
         printf("OpenDevice returned : [%ld]\n\n",err);

         ///////////////////////////////////////////////
         // getDeviceInfo()
         err = sgfplib->GetDeviceInfo(&deviceInfo);
         printf("GetDeviceInfo returned: %ld\n\n",err);

 	      imageBuffer1 = (BYTE*) malloc(deviceInfo.ImageWidth*deviceInfo.ImageHeight);

         ///////////////////////////////////////////////
         // Set Callback Function
         void* user_data;
         err = sgfplib->SetCallBackFunction(CALLBACK_AUTO_ON_EVENT, callback_function_auto_on, user_data);
         printf("SetCallBackFunction()  returned ... ");
         if (err != SGFDX_ERROR_NONE)
         {
            printf("FAIL - [%ld]\n",err);
            return(0);
         }
         else
            printf("SUCCESS - [%ld]\n",err);

         if (StartAutoOn(sgfplib))
         {
            long n=0;//Visual feedback
            while (1)
            {
               if (fingerPresent)
               {
                  n=0;//Reset visual feedback
                  printf("Finger Present\n");
	               if (!StopAutoOn(sgfplib))
                  {
                     printf("StopAutoOn() returned false.\n");
                     break;
                  }
                  printf("Call ISensor::GetImage()\n");
                  err = sgfplib->GetImage(imageBuffer1);
                  printf("ISensor::GetImage() returned ... ");
                  if (err != SGFDX_ERROR_NONE)
                  {
                     printf("FAIL - [%ld]\n",err);
                  }
                  else
                  {
                     printf("SUCCESS - [%ld]\n",err);
                     FILE *fp = fopen("test_auto_on_finger.raw","wb");
                     fwrite (imageBuffer1 , sizeof (BYTE) , deviceInfo.ImageWidth*deviceInfo.ImageHeight , fp);
                     fclose(fp);
                     fp = NULL;
                  }
                  printf(".............................................................\n");
                  printf("Press 'X' to exit, any other key to continue >> ");
                  if (getc(stdin) == 'X')
                     break;
  	               if(!StartAutoOn(sgfplib))
                  {
                     printf("StartAutoOn() returned false.\n");
                     break;
                  }
               }
               else
               {
                  ++n;//Visual feedback
                  printf("place finger on sensor ... [%ld]\n",n);
                  usleep(1000);
               }               
            }
        }
        else
        {
            printf("StartAutoOn() returned false.\n");
        }
        

        //////////////////////////////////////////////////////////////////////////
        // EnableAutoOnEvent(false)
        printf("Call sgfplib->EnableAutoOnEvent(false) ... \n");
        err = sgfplib->EnableAutoOnEvent(false,NULL,NULL);
        printf("EnableAutoOnEvent(false) returned : [%ld]\n", err);

        ///////////////////////////////////////////////
        // closeDevice()
        printf("\nCall fplib->CloseDevice()\n");
        err = sgfplib->CloseDevice();
        printf("CloseDevice returned : [%ld]\n",err);

        ///////////////////////////////////////////////
        // Destroy FPLib object
        printf("\nCall DestroySGFPMObject(fplib)\n");
        err = DestroySGFPMObject(sgfplib);
        printf("DestroySGFPMObject returned : [%ld]\n",err);

        free(imageBuffer1);
        imageBuffer1 = NULL;

     }
     return 0;
}
