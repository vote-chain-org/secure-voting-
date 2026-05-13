#*************************************************************
#*
#* Author :      SecuGen Corporation
#* Description : FPLibTest Makefile
#* Copyright(c): 2009 SecuGen Corporation, All rights reserved
#* date        person   comments
#* ======================================================
#* 12/10/2009  driley   initial release
#*
#*************************************************************

PORT = linux4X64
CFLAGS = -D__cplusplus -Wall -O
CPP=g++
CC=gcc
INCPATH = -I./ -I../include
LIBS =  -L../lib/$(PORT)

OBJS=	main.o

SRCS=	main.cpp

TARGET = $(PORT)/fake_test

all : $(TARGET)

$(TARGET) : $(OBJS)
	$(CPP) -o $@ $(OBJS) $(LIBS) -lsgfplib

.cc.o :
	$(CPP) $(FLAGS) $(INCPATH) -c $<

.c.o :
	$(CPP) $(FLAGS) $(INCPATH) -c $<

.cpp.o :
	$(CPP) $(FLAGS) $(INCPATH) -c $<

dep :
	gccmakedep $(INCPATH) $(SRCS)

clean :
	rm -rf *.raw *.min $(OBJS) $(TARGET) core
	rm -rf $(PORT)
	mkdir $(PORT)

