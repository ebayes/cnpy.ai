// page.tsx

"use client";

import React, { Suspense } from 'react';
import ClassSelector from "@/components/classSelector";
import CodeSnippetModal from "@/components/codeSnippet";
import Image from 'next/image';
import { useEffect, useRef, useState } from "react";
const PhotoGallery = React.lazy(() => import("@/components/gallery"));
import { FileInfo } from "@/components/fileInfo";
import { generateScript } from "@/components/generateScript";
import { ClassData } from "@/components/classData";
import { convertName } from "@/components/convertName";
// import { logRun, logFeedback, logFinal } from "@/components/Supabase";
import {
  MultimodalModel,
  ZeroShotClassificationModel,
  ZeroShotResult,
} from "@visheratin/web-ai/multimodal";
import { ClassificationPrediction, ImageModel } from "@visheratin/web-ai/image";
const FileLoader = React.lazy(() => import("@/components/fileLoader"));
import { Select, ActionIcon, ThemeIcon, TextInput, Textarea, Text, Title, Loader, Button, Badge, Tooltip, Slider, Avatar, Code, Anchor, Box, Flex, Popover, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import InputFieldsComponent from "@/components/classes";
import DrawerContent from "@/components/drawer";
import DrawerContentGeneral from "@/components/drawer2";
import { SegmentationModel, ModelType } from "@visheratin/web-ai/image"
import { SessionParams } from "@visheratin/web-ai";
import { IconArrowBarLeft, IconCheck, IconBrain, IconEdit, IconHelpCircle, IconMessageCircle2, IconPlayerPlay, IconPlayerStop, IconPower, IconTerminal2, IconUpload, IconX, IconDatabaseOff } from '@tabler/icons-react';
import { ShadowIcon } from '@radix-ui/react-icons'

interface NavbarComponentProps {
  onInputChange: (inputs: string[]) => void;
  modelCallback: (model: ZeroShotClassificationModel) => void;
  process: (
    power: number,
    statusCallback: (status: {
      progress: number;
      busy: boolean;
      message: string;
    }) => void
  ) => void;
  generateScript: () => void;
  classNum: number;
  stopProcessing: () => void;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const handleSubmit = () => {
    // logFeedback(feedbackName, feedbackEmail, feedbackMessage);
    // setShowNotification(true);
  };
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [classNames, setClassNames] = useState<string[]>([]);
  const [CLIPModel, setCLIPModel] = useState(false);
  const [unsortedFiles, setUnsortedFiles] = useState<FileInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [classFiles, setClassFiles] = useState<ClassData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [unixScript, setUnixScript] = useState("");
  const [winScript, setWinScript] = useState("");
  const toStop = useRef(false);
  const [movingFile, setMovingFile] = useState<FileInfo | undefined>();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedClass, setSelectedClass] = useState('All');
  const [classNum, setClassNum] = useState<number>(0);
  const [model, setModel] = useState<ZeroShotClassificationModel>();
  const [modelLoaded, setModelLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Custom');
  const progressRef = useRef<HTMLDivElement>(null);
  const powerRef = useRef<HTMLInputElement>(null);
  const [totalImagesPerClass, setTotalImagesPerClass] = useState<Record<string, number>>(
    classNames.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
  );  
  const [showSettings, setShowSettings] = useState(false);

  const [otherValues, setOtherValues] = useState<string[]>([]);

  const removeFromUnsorted = (hash: string) => {
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      const fileIndex = prevFiles.findIndex(file => file.hash === hash);
      if (fileIndex === -1) return prevFiles; // File not found in unsortedFiles
  
      const file = prevFiles[fileIndex];
      const highestPredictionClass = file.classPredictions[0].class;
  
      // Remove file from unsortedFiles
      prevFiles.splice(fileIndex, 1);
  
      // Add file to the class it has the highest prediction for
      setClassFiles((prevClassFiles: ClassData[]) => {
        const classIndex = prevClassFiles.findIndex(cls => cls.name === highestPredictionClass);
        if (classIndex !== -1) {
          prevClassFiles[classIndex].files.push(file);
        }
        return [...prevClassFiles];
      });
  
      // Update totalImagesPerClass
      setTotalImagesPerClass(prevState => {
        const newState = { ...prevState };
        newState['Unsorted'] = (newState['Unsorted'] || 0) - 1;
        newState[highestPredictionClass] = (newState[highestPredictionClass] || 0) + 1;
        return newState;
      });
  
      // Update classChanges
      setClassChanges(prevState => {
        const newState = { ...prevState };
        newState[highestPredictionClass] = (newState[highestPredictionClass] || 0) + 1;
        return newState;
      });
  
      return [...prevFiles];
    });
  };

  useEffect(() => {
    // Fetch the JSON file
    fetch('https://web-ai-models.org/image/classification/mobilevit-small/config.json')
      .then((response) => response.json())
      .then((data) => {
        // Extract the values from the "id2label" field and store them in 'otherValues'
        if ('id2label' in data) {
          const values = Object.values(data.id2label).map(String);
          setOtherValues(values);
          setIsLoading(false);
        }        
      })
      .catch((error) => {
        console.error('Error fetching JSON:', error);
      });
  }, []);
  

  const [classChanges, setClassChanges] = useState<Record<string, number>>(() => {
    const changes: Record<string, number> = {};
    classNames.forEach((className) => {
      changes[className] = 0;
    });
    return changes;
  });

  const MARKS = [
    { value: 1, label: 'sm' },
    { value: 50, label: 'md' },
    { value: 100, label: 'lg' },
  ];

  const classOptions = [
    {label: 'All', value: 'All'},
    {label: 'Unsorted', value: 'Unsorted'}, // new option
    ...classNames.map(name => ({label: name, value: name}))
  ];

  const filteredClasses = 
  selectedClass === 'All' ? classFiles : 
  selectedClass === 'Unsorted' ? [ { name: 'Unsorted', files: unsortedFiles, duplicates: [] } ] : 
  classFiles.filter(c => c.name === selectedClass);

  const onInputChange = (inputs: string[]) => {
    setClassNames(inputs);
    setClassNum(inputs.length);
  };
  
  const modelCallback = (model: ZeroShotClassificationModel) => {
    setModel(model);
    const changes: Record<string, number> = {};
    classNames.forEach((className) => {
      changes[className] = 0;
    });
    setClassChanges(changes);
  };

  const modelCallback2 = (model: any) => {
    setModel(model);
    const changes: Record<string, number> = {};
    classNames.forEach((className) => {
      changes[className] = 0;
    });
    setClassChanges(changes);
  };
  
  const setNewFiles = (newFiles: FileInfo[]) => {
    const existingFiles = files.map((file) => file.hash);
    const filteredNewFiles = newFiles.filter(
      (file) => !existingFiles.includes(file.hash)
    );
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      return [...prevFiles, ...filteredNewFiles];
    });
    setFiles((prevFiles: FileInfo[]) => {
      return [...prevFiles, ...filteredNewFiles];
    });
  };

  const bgColors = [
    "bg-[#E7EBF6]",
    "bg-[#F6E6E6]",
    "bg-[#E0F0E5]",
    "bg-[#D9F0F6]",
    "bg-[#EFE8E5]",
    "bg-[#F5E6EA]",
    "bg-[#F3E6F3]",
    "bg-[#E4EDF6]",
    "bg-[#DEF0F2]",
    "bg-[#DEF0EC]",
    "bg-[#F7E5CD]",
    "bg-[#EFE8E1]",
    "bg-[#D9F0F6]",
    "bg-[#D4F2EA]",
    "bg-[#E4F1D1]",
    "bg-[#F7F1BE]",
    "bg-[#F7EBC8]"
  ];
  
  
  let colorIndex = 0;
  
  function getNextBgColor() {
    const selectedColor = bgColors[colorIndex];
    colorIndex = (colorIndex + 1) % bgColors.length;
    return selectedColor;
  }

  const processFiles = async (
    power: number,
    setStatus: (status: {
      progress: number;
      busy: boolean;
      message: string;
    }) => void
  ) => {
    if (!model) {
      setStatus({ busy: false, progress: 0, message: "Model was not loaded!" });
      setTimeout(() => {
        setStatus({
          busy: false,
          progress: 0,
          message: "Waiting for the model",
        });
      }, 2000);
      return;
    }
    const classes = [...classNames];
    if (
      classes.length === 0 ||
      classes.filter((c) => c.length > 0).length === 0
    ) {
      setStatus({
        busy: false,
        progress: 0,
        message: "No classes were set!",
      });
      return;
    }
    const newClasses = classes.map((name): ClassData => {
      return {
        name: name,
        files: [],
        duplicates: [],
      };
    });
    setStatus({ progress: 0, busy: true, message: "Processing..." });
    const start = performance.now();
    const batch = power;
    const dataFiles = [...files];
    setUnsortedFiles([...files]);
    for (let i = 0; i < dataFiles.length; i += batch) {
      setStatus({
        busy: true,
        message: "Processing...",
        progress: (i / dataFiles.length) * 100,
      });
      const toProcessFiles = dataFiles.slice(i, i + batch);
      const toProcess = toProcessFiles.map((file) => file.src);
      const result = (await model.process(
        toProcess,
        classes
      )) as ZeroShotResult;
      if (toProcess.length === 1) {
        const prediction = result.results as ClassificationPrediction[];
        processResult(
          toProcessFiles[0],
          prediction,
          result.imageFeatures[0],
          newClasses,
          classes
          
        );
      } else {
        const predictions = result.results as ClassificationPrediction[][];
        predictions.forEach((pred, index) => {
          const prediction = pred as ClassificationPrediction[];
          processResult(
            toProcessFiles[index],
            prediction,
            result.imageFeatures[index],
            newClasses,
            classes
          );
        });
      }
      if (toStop.current) {
        setStatus({
          progress: 0,
          busy: false,
          message: "Stopped",
        });
        toStop.current = false;
        return;
      }
    }
    const end = performance.now();
    const elapsed = Math.round((end - start) / 10) / 100;
    setStatus({
      progress: 100,
      busy: false,
      message: `${elapsed}`,
    });
 
    const imageCount = files.length;
    const classesCount: Record<string, number> = {};
    newClasses.forEach((classData) => {
      classesCount[classData.name] = classData.files.length;
    });
      
    // logrun in supabase
    // logRun(selectedModel, imageCount, classesCount, elapsed);
  };

  const processFiles2 = async (
    power: number,
    setStatus: (status: {
      progress: number;
      busy: boolean;
      message: string;
    }) => void
  ) => {
    if (!model) {
      setStatus({ busy: false, progress: 0, message: "Model was not loaded!" });
      setTimeout(() => {
        setStatus({
          busy: false,
          progress: 0,
          message: "Waiting for the model",
        });
      }, 2000);
      return;
    }
    const classes = [...otherValues];
    if (
      classes.length === 0 ||
      classes.filter((c) => c.length > 0).length === 0
    ) {
      setStatus({
        busy: false,
        progress: 0,
        message: "No classes were set!",
      });
      return;
    }
    const newClasses = classes.map((name): ClassData => {
      return {
        name: name,
        files: [],
        duplicates: [],
      };
    });
    setStatus({ progress: 0, busy: true, message: "Processing..." });
    const start = performance.now();
    const batch = power;
    const dataFiles = [...files];
    setUnsortedFiles([...files]);
    for (let i = 0; i < dataFiles.length; i += batch) {
      setStatus({
        busy: true,
        message: "Processing...",
        progress: (i / dataFiles.length) * 100,
      });
      const toProcessFiles = dataFiles.slice(i, i + batch);
      const toProcess = toProcessFiles.map((file) => file.src);
      const result = await model.process(toProcess, 3 as any);
      if (toProcess.length === 1) {
        const prediction = result.results as ClassificationPrediction[];
        processResult2(
          toProcessFiles[0],
          prediction,
          newClasses,
          classes
          
        );
      } else {
        const predictions = result.results as ClassificationPrediction[][];
        predictions.forEach((pred, index) => {
          const prediction = pred;
          processResult2(
            toProcessFiles[index],
            prediction,
            newClasses,
            classes
          );
        });
      }
      if (toStop.current) {
        setStatus({
          progress: 0,
          busy: false,
          message: "Stopped",
        });
        toStop.current = false;
        return;
      }
    }
    const end = performance.now();
    const elapsed = Math.round((end - start) / 10) / 100;
    setStatus({
      progress: 100,
      busy: false,
      message: `${elapsed}`,
    });
    const imageCount = files.length;
    const classesCount: Record<string, number> = {};
    newClasses.forEach((classData) => {
      classesCount[classData.name] = classData.files.length;
    });

    // logrun in supabase
    // logRun(selectedModel, imageCount, classesCount, elapsed);
  };

  const processResult = (
    file: FileInfo,
    result: ClassificationPrediction[],
    embedding: number[],
    classData: ClassData[],
    classes: string[]
  ) => {
    file.classPredictions = result;
    if (result.length === 0) {
      return;
    }
    if (result[0].confidence < 0.3) { // 0.5
      return;
    }
    file.embedding = embedding;
    const foundClass = result[0].class;
    const foundClassIndex = classes.indexOf(foundClass);
    classData[foundClassIndex].files.push(file);

    file.newClass = foundClass; 
    file.color = "bg-red-300"; // here

    setClassFiles([...classData]);
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      const unsortedIdx = prevFiles.indexOf(file);
      prevFiles.splice(unsortedIdx, 1);
      return [...prevFiles];
    });
    return;
  };

  const processResult2 = (
    file: FileInfo,
    result: ClassificationPrediction[],
    classData: ClassData[],
    classes: string[]
  ) => {
    file.classPredictions = result;
    if (result.length === 0) {
      return;
    }
    if (result[0].confidence < 0.3) { // 0.5
      return;
    }
    const foundClass = result[0].class;
    const foundClassIndex = classes.indexOf(foundClass);
    classData[foundClassIndex].files.push(file);

    file.newClass = foundClass; 
    file.color = "bg-red-300"; // here

    setClassFiles([...classData]);
    setUnsortedFiles((prevFiles: FileInfo[]) => {
      const unsortedIdx = prevFiles.indexOf(file);
      prevFiles.splice(unsortedIdx, 1);
      return [...prevFiles];
    });
    return;
  };

  const markDeleted = (hash: string) => {
    const clsFiles = [...classFiles];
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      for (let j = 0; j < cls.files.length; j++) {
        const file = cls.files[j];
        if (file.hash === hash) {
          file.toDelete = !file.toDelete;
          setClassFiles(clsFiles);
          return;
        }
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        for (let k = 0; k < dupes.files.length; k++) {
          const file = dupes.files[k];
          if (file.hash === hash) {
            file.toDelete = !file.toDelete;
            setClassFiles(clsFiles);
            return;
          }
        }
      }
    }
    const unsorted = [...unsortedFiles];
    for (let i = 0; i < unsorted.length; i++) {
      const file = unsorted[i];
      if (file.hash === hash) {
        file.toDelete = !file.toDelete;
        setUnsortedFiles(unsorted);
        return;
      }
    }
  };



  const stopProcessing = () => {
    console.log("Stopping processing");
    toStop.current = true;
  };

  const startFileMoving = (file: FileInfo | undefined) => {
    setMovingFile(file);
    setShowMoveModal(true);
  };

  const moveToClass = (file: FileInfo, clsName: string) => {
    console.log(`Moving ${file.name} to ${clsName}`);
    const clsFiles = [...classFiles];
    let currentClass = "";
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      if (cls.files.includes(file)) {
        currentClass = cls.name;
        break;
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        if (dupes.files.includes(file)) {
          currentClass = cls.name;
          break;
        }
      }
    }
    if (currentClass === clsName) {
      return;
    }
    for (let i = 0; i < clsFiles.length; i++) {
      const cls = clsFiles[i];
      if (cls.name === clsName) {
        cls.files.push(file);
        continue;
      }
      if (cls.files.includes(file)) {
        cls.files.splice(cls.files.indexOf(file), 1);
        continue;
      }
      for (let j = 0; j < cls.duplicates.length; j++) {
        const dupes = cls.duplicates[j];
        if (dupes.files.includes(file)) {
          dupes.files.splice(dupes.files.indexOf(file), 1);
          continue;
        }
      }
    }
    setClassFiles(clsFiles);
    for (let i = 0; i < unsortedFiles.length; i++) {
      const unsorted = unsortedFiles[i];
      if (unsorted === file) {
        unsortedFiles.splice(i, 1);
        break;
      }
    }
    file.classPredictions[0].class = clsName;
    setClassChanges((prev) => ({
      ...prev,
      [clsName]: (prev[clsName] || 0) + 1,
      [currentClass]: (prev[currentClass] || 0) + 1,
    }));
    setUnsortedFiles(unsortedFiles);
  };

  const [status, setStatus] = useState({
    progress: 0,
    busy: false,
    message: "Waiting for AI",
  });

  const setProgressValue = (percentage: number) => {
    if (progressRef.current) {
      progressRef.current.style.width = `${percentage}%`;  
    }
  };

  const loadCLIP = async () => {
    setCLIPModel(true);
    const power = 4;
    SessionParams.numThreads = power;
    setStatus({ ...status, busy: true, message: "Initializing AI..." });
    const modelResult = await MultimodalModel.create("clip-base-quant");
    console.log(`Model loading time: ${modelResult.elapsed}s`);
    modelCallback(modelResult.model as ZeroShotClassificationModel);
    setModelLoaded(true);
    setStatus({ ...status, busy: false, message: "AI was initialized!" });
    setTimeout(() => {
      setStatus({ ...status, message: "Ready" });
    }, 2000);
  };

  const loadOther = async () => {
    setCLIPModel(false);
    const power = 4;
    SessionParams.numThreads = power;
    setStatus({ ...status, busy: true, message: "Initializing AI..." });
    const modelResult = await ImageModel.create("mobilevit-small"); // fastvit-large-quant, tiny etc
    console.log(`Model loading time: ${modelResult.elapsed}s`);
    modelCallback2(modelResult.model);
    setModelLoaded(true);
    setStatus({ ...status, busy: false, message: "AI was initialized!" });
    setTimeout(() => {
      setStatus({ ...status, message: "Ready" });
    }, 2000);
  };

  const process = () => {
    // clear classes
    const power = 4;
    if (CLIPModel) {
      processFiles(power, setStatus);
    } else {
      processFiles2(power, setStatus);
    }
  };

  useEffect(() => {
    const totalImages: Record<string, number> = {};
    for (const cls of classFiles) {
      totalImages[cls.name] = cls.files.length + cls.duplicates.reduce((acc, curr) => acc + curr.files.length, 0);
    }
    setTotalImagesPerClass(totalImages);
  }, [classFiles, unsortedFiles]); 
  
  useEffect(() => {
    setProgressValue(status.progress);
  }, [status.progress]);

  const totalImagesAllClasses = Object.values(totalImagesPerClass).reduce((sum, count) => sum + count, 0);

  let classesToPass = classNames; 

  if (selectedModel === 'Other') {
    classesToPass = otherValues;
  }

  

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
         <header 
        id="header" 
        style={{backgroundColor: "#F2F2F5", borderBottom: "1px solid #DDDDE3", height: '55px' }}
        className="px-5 py-3 flex justify-between"
      >
        <div className="flex items-center justify-end gap-2 pl-1">
        <ShadowIcon width={17} height={17} />

        <Image 
          src="/icons/logo.png" 
          alt="Logo" 
          className="object-contain"
          width={85}
          height={85}
        />
        </div>
        
        
          

        </header>
        <header 
          id="subheader" 
          style={{backgroundColor: "#FCFCFD", borderBottom: "1px solid #E4E1D8"}}
          className="px-5 py-2 h-[3.5rem] flex justify-between"
        ></header>
        <div className='flex-grow w-full flex items-center justify-center'>
          <Loader color="gray" size="1rem" />
        </div>
        <footer 
        id="footer" 
        className="bg-[#F2F2F5] border-t-[1px] border-[#DDDDE3] px-5 py-3 flex items-center justify-center"
        style={{ height: '55px' }}
      >

      </footer>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }} className="flex flex-col min-h-screen">
     

      <header 
        id="header" 
        style={{backgroundColor: "#F2F2F5", borderBottom: "1px solid #DDDDE3", height: '55px' }}
        className="px-5 py-3 flex justify-between"
      >
        <div className="flex items-center justify-end gap-2 pl-1">
        <ShadowIcon width={17} height={17} />

        <Image 
          src="/icons/logo.png" 
          alt="Logo" 
          className="object-contain"
          width={85}
          height={85}
        />
        </div>
        <div className="flex items-center justify-end">
          {/* 
        <Tooltip
          multiline
          width={200}
          label="Canopy is a privacy-preserving tool for conservationists to sort camera trap data using machine learning without any data leaving their browser. It works best with datasets under 500 images."
          color="dark"
          withArrow
          arrowPosition="center"
          transitionProps={{ duration: 200 }}
        >
        <ThemeIcon 
          variant="light" color="gray"
          size="lg"
          className="text-black flex items-center justify-center bg-transparent"
        >
          <IconHelpCircle size="1rem"/>
        </ThemeIcon >
        </Tooltip>
        */}

        
        <Popover width={300} trapFocus position="bottom" withArrow shadow="md" >
        <Popover.Target>
          <Tooltip          
            label="Click for more info."
            color="dark"
            withArrow
            arrowPosition="center"
            transitionProps={{ duration: 200 }}
          >
          <ActionIcon 
            size="lg"
            variant="transparent"
            className="text-black flex items-center justify-center"
          >
            <IconHelpCircle size="1rem"/>
          </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown className='gap-3' sx={(theme) => ({ background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' })}>
          <Text 
            size="sm" 
            style={{ width: '100%' }} 
          > 
            Canopy is a privacy-preserving tool that helps conservationists sort camera trap data using machine learning without any data leaving the browser. It works best with datasets under 500 images. A test dataset can be found <Anchor td="underline" color='black' target="_blank" href="https://drive.google.com/drive/folders/14LSwjlZqYIyje114y_Tq5L82Re9HWulo?usp=sharing">here</Anchor>. Instructions can be found <Anchor td="underline" color='black' target="_blank" href="https://docs.google.com/document/d/1KBIUssYTRrHIpuhtfsvNKtVEbW9HQ5fTt7pfAbrc0Dc/edit?usp=sharing">here</Anchor>.
          </Text>
          
        </Popover.Dropdown>
      </Popover>
      

        {/* 
        <Popover width={300} trapFocus position="bottom" withArrow shadow="md" onClose={() => setShowNotification(false)}>
        <Popover.Target>
          <Tooltip          
            label="Submit feedback"
            color="dark"
            withArrow
            arrowPosition="center"
            transitionProps={{ duration: 200 }}
          >
          <ActionIcon 
            size="lg"
            variant="transparent"
            className="text-black flex items-center justify-center"
          >
            <IconMessageCircle2 size="1rem"/>
          </ActionIcon>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown className='gap-3' sx={(theme) => ({ background: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '100%' })}>
          <TextInput 
            label="Name:" 
            placeholder="Insert name" 
            size="sm" 
            style={{ width: '100%' }} 
            value={feedbackName} 
            onChange={(event) => setFeedbackName(event.currentTarget.value)}
          />
          <TextInput 
            label="Email:" 
            placeholder="Insert email" 
            size="sm" 
            style={{ width: '100%' }} 
            value={feedbackEmail} 
            onChange={(event) => setFeedbackEmail(event.currentTarget.value)}
          />
          <Textarea 
            label="Feedback:" 
            placeholder="Insert message here"
            minRows={5}
            size="sm"
            style={{ width: '100%' }}
            value={feedbackMessage} 
            onChange={(event) => setFeedbackMessage(event.currentTarget.value)}
          />
          <Button 
            onClick={handleSubmit}
            className="bg-blue-100 text-blue-400 hover:text-blue-600 hover:bg-blue-300  flex items-center justify-center"
            style={{ width: '100%' }}
          >
            {showNotification ? <IconCheck size="1rem"/> : 'Submit'}
          </Button>
        </Popover.Dropdown>
      </Popover>
      */}

</div>

      </header>
      <header 
        id="subheader" 
        style={{backgroundColor: "#FCFCFD", borderBottom: "1px solid #DDDDE3"}}
        className="px-5 py-2 h-[3.5rem] flex justify-between "
      >
        <div id="uploadbuttons" className='flex gap-2'>
          <div style={{ height: '35px' }}>
          <Tooltip
              label="Click or drag and drop to add a new dataset"
              color="dark"
              withArrow
              arrowPosition="center"
            >
              <Suspense fallback={<div></div>}>
            <FileLoader setNewFiles={setNewFiles} />
            </Suspense>
            </Tooltip>
          </div>
        <Tooltip
          label="Clear photos"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon 
          size="lg"
          disabled={files.length === 0}
          onClick={() => {
            setFiles([]);
            setClassFiles([]);
            setTotalImagesPerClass({});
            setUnsortedFiles([]);
            setStatus(prevStatus => ({
              ...prevStatus,
              progress: 0
            }));
            setSelectedClass("All"); 
          }}
          className="bg-[#E5484D] text-white hover:bg-red-600 flex items-center justify-center"
        >
          <IconX size="1rem"/>
        </ActionIcon >
        </Tooltip>
        </div>

        <div
  id="mainbuttons"
  className="flex items-center space-between gap-2"
>

      <Tooltip
        label="Edit model settings"
        color="dark"
        withArrow
        arrowPosition="center"
      >
      <Button 
        rightIcon={<IconHelpCircle size="1rem" />}
        onClick={() => setShowSettings(true)}
        className="bg-[#EDF1FD] text-[#3E63DD] hover:bg-[#AEC0F5]  flex items-center justify-center"
      >
        Model
      </Button>
      </Tooltip>

        <div className="w-40">
        <Select
          id="choosemodel"
          placeholder="Choose model"
          defaultValue="Custom"
          data={[
            { value: 'Custom', label: '🧠  Custom' },
            { value: 'Other', label: '🇧🇹  India/Bhutan' },
            { value: 'New', label: '➕  Add new', disabled: true },
          ]}
          onChange={(value) => {
            setStatus({
              progress: 0,
              busy: false,
              message: "Reset progress",
            });
            setSelectedModel(value || '');
            setModelLoaded(false);
          }}
        />
        </div>

      <div style={modelLoaded ? { display: "none" } : {}}> 
        <Tooltip
          label="Load model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
          <ActionIcon
            id="poweron"
            // disabled={status.busy}
            size="lg"
            onClick={() => {
              if (selectedModel === 'Custom') {
                loadCLIP();
              } else if (selectedModel === 'Other') {
                loadOther();
              }
            }}
            className="bg-orange-400 text-white hover:bg-orange-500  flex items-center justify-center"
          >
            {status.busy ? <Loader color="white" size="1rem" /> : <IconPower size="1rem"/>}
          </ActionIcon>
        </Tooltip>
      </div>
      <div style={!modelLoaded ? { display: "none" } : {}}>
        <Tooltip
          label="Unload model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
          <ActionIcon
            id="poweroff"
            size="lg"
            // disabled={status.busy}
            onClick={() => {
              // setClassFiles([]);
              setModelLoaded(false);
              setStatus({
                progress: 0,
                busy: false,
                message: "Reset progress",
              });
            }}
            className="bg-[#E5484D] text-white hover:bg-red-600  flex items-center justify-center"
          >
            <IconPower size="1rem"/>
          </ActionIcon>
        </Tooltip>
       </div>
        
    {(!modelLoaded || classNum === 0 || !status.busy) ? ( 
    <Tooltip
          label="Run model"
          color="dark"
          withArrow
          arrowPosition="center"
        >
      <ActionIcon
        size="lg"
        disabled={!modelLoaded || classNum === 0 || status.busy}
        onClick={() => {
          setClassFiles([]);
          process();
        }}
        className="bg-[#30A46C] text-white hover:bg-emerald-700 flex items-center justify-center"
      >
        <IconPlayerPlay size="1rem"/>
      </ActionIcon>
    </Tooltip>
   ) : ( 
    
        <Avatar 
        variant="filled" 
        color="green"
        size="sm"
        style={{ width: '35px', height: '35px' }}
      >
        {Math.round(status.progress)}%
      </Avatar>
   )} 
        
        <ActionIcon
          size="lg"
          disabled={!modelLoaded || classNum === 0 || !status.busy}
          onClick={() => {
            console.log("stopping");
            stopProcessing();
          }}
          className="bg-[#E5484D] text-white hover:bg-red-600  flex items-center justify-center"
        >
          <IconPlayerStop size="1rem"/>
        </ActionIcon>
  
        <Tooltip
          label="Terminal commands"
          color="dark"
          withArrow
          arrowPosition="center"
        >
        <ActionIcon 
          size="lg"
          disabled={status.busy || !modelLoaded || classNum === 0 || status.progress !== 100}
          onClick={() => generateScript(
            unsortedFiles, 
            classFiles, 
            selectedModel, 
            convertName, 
            files, 
            status, 
            classChanges, 
            setTotalImagesPerClass, 
            setUnixScript, 
            setWinScript, 
            setModalOpen
          )}
          className="bg-[#30A46C] text-white hover:bg-emerald-700  flex items-center justify-center"
        >
          <IconTerminal2 size="1rem"/>
        </ActionIcon >
        </Tooltip>
        </div>
      </header>

      <header 
      id="subsubheader" 
      className="px-5 py-2.5 flex justify-between"
      style={{ display: 'flex' }}
    >
      <div 
        id="leftbuttons" 
        style={{ 
          flex: 1,  // updated from 0.7 to 1
          visibility: files.length === 0 ? 'hidden' : 'visible', 
          overflowX: 'auto' 
        }}
        className="flex gap-2 overflow-x-auto whitespace-nowrap"
      >
         
              <Button 
                id={`badgeclass-all`} 
                key="UnsortedFiles" 
                radius="xl" 
                size="xs"
                compact
                onClick={() => setSelectedClass("All")}
                className={`bg-[#E9E9EC] text-[#575B64] hover:bg-gray-300`}
              >
                {files.length} Images
              </Button>
              
              {
                (!status.busy && modelLoaded && classNum !== 0 && status.progress === 100 && unsortedFiles.length !== 0) && (
                  <Button 
                    id={`badgeclass-unsorted`} 
                    key="UnsortedFiles" 
                    radius="xl" 
                    size="xs"
                    compact
                    onClick={() => setSelectedClass("Unsorted")}
                    className="bg-[#FAEECD] text-[#905526] hover:bg-gray-300"
                  >
                    ⚠️ {unsortedFiles.length} to review
                  </Button>
                )
              }

{Object.entries(totalImagesPerClass)
  .filter(([clsName, totalImages]) => totalImages > 0)
  .map(([clsName, totalImages], index) => {
    const displayName = clsName; 
    const nextColor = getNextBgColor(); 
    if (status.progress === 0) {
      return null; // or return some placeholder component
    }
    return (
      <Tooltip
          key={index} // Add this line
          label={selectedModel === "Other" ? convertName(displayName) : displayName}
          color="dark"
          withArrow
          arrowPosition="center"
          transitionProps={{ duration: 200 }}
        >
      <Box w={110}>
      <Button 
        id={`badgeclass-${clsName}`} 
        fullWidth
        radius="xl" 
        size="xs"
        compact
        onClick={() => setSelectedClass(clsName)}
        className={`${nextColor} text-[#575B64] hover:bg-gray-300`}
      >
        {totalImages} {selectedModel === "Other" ? convertName(displayName) : displayName}
      </Button>
      </Box>
      </Tooltip>
    );
  })}
           
          
        </div>
        {!(files.length === 0 || status.busy || !modelLoaded || classNum === 0 || status.progress !== 100 || classFiles.length === 0) && ( 
            <div
              id="runinfo"
              className='pl-3'
              style={{ 
                display: 'flex', // this will keep the div as a flex container
                justifyContent: 'flex-end', // this will align children to the right
              }}
            >
              <Code className="bg-[#EDF1FD] text-[#3E63DD]" style={{ whiteSpace: 'nowrap' }}>  {/* added whiteSpace: 'nowrap' */}
                {files.length} images sorted in {status.message}s ({(files.length / parseFloat(status.message)).toFixed(1)} images/s)
              </Code>
            </div>
          )}

      </header>

      <div className="flex flex-col lg:flex-row flex-grow h-full">
              
        
        <main 
          id="photos" 
          style={{ maxHeight: '71vh' }}
          className="flex flex-grow px-5 overflow-auto"
        > 
        {files.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
  <div id="upload" className="flex justify-center items-center">
    <div
      className="flex justify-center items-center rounded-lg px-6 py-4 text-center border-dotted border-2 border-gray-300"
    >
      <Stack align="center" justify="center" h={100} w={180}>
        <ThemeIcon variant="default" color="gray">
          <IconDatabaseOff size="1rem" />
        </ThemeIcon>
        <Text fz="sm" ta="center">Gallery empty. Click <Text span inherit fw={500} className='text-[#3E63DD]'>upload </Text>to add a new dataset.</Text>
      </Stack>
    </div>
  </div> 
</div>
        ) : 
          selectedClass === 'All'
            ? <PhotoGallery
                images={unsortedFiles.concat(...classFiles.flatMap(c => c.files))} // concatenate unsortedFiles and each file of classFile
                duplicates={[]}
                markDeleted={markDeleted}
                moveToClass={startFileMoving}
                unsortedImages={unsortedFiles}
                removeFromUnsorted={removeFromUnsorted}
                busy={status.busy}
                modelLoaded={modelLoaded}
                classNum={classNum}
                progress={status.progress}
                selectedClass={selectedClass}
                selectedModel={selectedModel}
              />
            : filteredClasses.map(item => (
              <section key={item.name}>
                {selectedClass !== 'All' && item.files.length === 0 &&
                    <div className='flex justify-between w-full items-center'>
                      <Text fz="sm">No{'\u00A0'}</Text>
                      <Box w={100}>
                      {selectedModel !== "Other" && (
                        <Text fz="sm" truncate lineClamp={1}> 
                          {item.name}
                        </Text>
                      )}
                      </Box>
                      <Text fz="sm">... images found</Text>
                    </div>
                  } 
                  <Suspense fallback={<div><Loader color="gray" size="1rem" /></div>}>
                <PhotoGallery
                  images={item.files}
                  duplicates={item.duplicates}
                  markDeleted={markDeleted}
                  moveToClass={startFileMoving}
                  unsortedImages={unsortedFiles}
                  removeFromUnsorted={removeFromUnsorted}
                  busy={status.busy}
                  modelLoaded={modelLoaded}
                  classNum={classNum}
                  progress={status.progress}
                  selectedClass={selectedClass}
                  selectedModel={selectedModel}
                />
                </Suspense>
              </section>
            ))}

<div 
  className='pl-5' 
  style={{ 
    minWidth: '455px', 
    maxWidth: '455px', 
    display: showSettings ? 'block' : 'none',
  }}
>
<nav 
  id="modelsettings" 
  className="bg-white p-5 border border-gray-300 h-full rounded-lg" 
>
          <div  className="grid grid-cols-1 gap-4"> 
              <div className="grid grid-cols-1 gap-4">
                  {selectedModel === "Custom" ? (
                      <>
                          <div className='flex justify-between'> 
                            <Title order={4}>Model settings</Title>
                            <ActionIcon
                              onClick={() => setShowSettings(false)} 
                            >
                              <IconX size="1rem"></IconX>
                            </ActionIcon>
                          </div>
                          <DrawerContent/>
                          <InputFieldsComponent
                              onInputChange={onInputChange}
                              busy={status.busy}
                              modelLoaded={modelLoaded}
                          />
                      </>
                  ) : selectedModel === "Other" ? (
                    <>
                    <div className='flex justify-between'> 
                      <Title order={4}>Model settings</Title>
                      <ActionIcon
                        onClick={() => setShowSettings(false)} 
                      >
                        <IconX size="1rem"></IconX>
                      </ActionIcon>
                    </div>
                    <DrawerContentGeneral/>
                </>
                  ) : null}
              </div>
          </div>
      </nav>
      </div>

        
        </main>

      </div>
      <footer 
        id="footer" 
        className="bg-[#F2F2F5] border-t-[1px] border-[#DDDDE3] px-5 py-3 flex items-center justify-center"
        style={{ height: '55px' }}
      >
        <Text fz="sm" ta="center">
          {/* Built by <Anchor target="_blank" href="https://www.general-purpose.io" color='black'>General Purpose</Anchor>; */}
          Powered by <Anchor color='black' target="_blank" href="https://github.com/visheratin/web-ai">WebAI</Anchor>.
        </Text>
      </footer>

      <CodeSnippetModal
        unixCode={unixScript}
        windowsCode={winScript}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
      <ClassSelector
        classes={classesToPass}
        onClassSet={moveToClass}
        file={movingFile}
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        selectedModel={selectedModel}
      />
    </div> 
  );
}


{/*  <div id="changesize" style={ { width: '160px' } } className="items-center">
          <Slider
            disabled
            color="dark"
            size="sm"
            showLabelOnHover={false}
            marks={[
              { value: 1, label: 'sm' },
              { value: 50, label: 'md' },
              { value: 100, label: 'lg' },
            ]}
            defaultValue={50}
            step={50}
          />
        </div>
        */}

          {/* 
  <div id="dropdown" className="w-40 mr-2">
    <Select
      placeholder="Choose class"
      value={selectedClass}
      data={classOptions}
      onChange={setSelectedClass}
    />
  </div>
  */}