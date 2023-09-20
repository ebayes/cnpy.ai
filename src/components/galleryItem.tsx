// galleryItem.tsx

import React, { useState } from "react";
import Image from 'next/image';
import { FileInfo } from "./fileInfo";
import { IconCheck, IconEdit, IconRestore, IconTrash, IconX, IconAlertTriangle } from "@tabler/icons-react";
import { Badge, Text, ThemeIcon } from "@mantine/core";
import { convertName } from "@/components/convertName";


interface GalleryItemProps {
  image: FileInfo;
  markDeleted: (src: string) => void;
  openImage: (file: FileInfo) => void;
  moveToClass: (file: FileInfo | undefined) => void;
  isUnsortedFile: boolean;
  removeFromUnsorted: (hash: string) => void;
  busy: boolean;
  modelLoaded: boolean;
  classNum: number;
  progress: number;
  selectedClass: string;
  selectedModel: string;
}

const GalleryItem = (props: GalleryItemProps) => {
  return (
    <div 
      key={props.image.src} 
      className="cursor-pointer relative"
      >
      
      <div 
  key={props.image.src} 
  className="cursor-pointer relative pb-1"
>
  <Image
    width={160}
    height={110}
    style={{
      height: '110px',
      width: '160px',
      objectFit: props.image.toDelete ? 'cover' : 'cover',
      filter: props.image.toDelete ? 'grayscale(1) blur(1px)' : 'none',
      borderRadius: '6px'
    }}
    src={props.image.src}
    alt={props.image.name || "Gallery image"}
    onClick={() => props.openImage(props.image)}
  />

{props.isUnsortedFile && (
  <div 
    id="alert" 
    className="absolute top-0 right-0 flex items-center justify-center bg-[#FAEECD]" 
    style={{ 
      visibility: !props.modelLoaded || props.progress !== 100 ? 'hidden' : 'visible', 
      width: '1.5rem',
      height: '1.5rem',
      borderBottomLeftRadius: '5px',
      borderTopRightRadius: '5px',
    }}
  >
    <Text fz="xs" c="#905526">⚠️</Text>
  </div>
)}
</div>

<div id="namebuttons" className="flex justify-between items-center w-full pt-1">
  <Text id="filename" size="xs" className="flex-grow" truncate>
    {props.image.name}
  </Text>

  <div className="flex gap-1">


    {!props.isUnsortedFile && props.image.classPredictions && props.image.classPredictions.length > 0 && props.image.classPredictions[0].class && (
  <>
    <button
      id="edit"
      onClick={() => {props.moveToClass(props.image);}}
      className="w-5 h-5 flex items-center justify-center rounded-sm bg-[#F2F2F5]" 
    >
      <IconEdit size="0.7rem" color="#60646C"/>
    </button>
  </>
)}


{props.isUnsortedFile ? (
  <div 
    id="yesno" 
    className="flex justify-between items-center rounded-lg gap-1" 
    style={{ 
      visibility: !props.modelLoaded || props.progress !== 100 ? 'hidden' : 'visible', 
    }} // style={{ visibility: props.busy || !props.modelLoaded || props.classNum === 0 || props.progress !== 100 ? 'hidden' : 'visible' }}
  >
<button 
  className="w-5 h-5 flex items-center justify-center bg-[#30A46C] rounded-sm"
  onClick={() => {
    props.removeFromUnsorted(props.image.hash);
  }}
>
  <IconCheck color="white" size="0.8rem"/>
</button>
    <button className="w-5 h-5 flex items-center justify-center bg-[#E5484D] rounded-sm" onClick={() => {props.moveToClass(props.image);}}>
      <IconX color="white" size="0.8rem"/>
    </button>
  </div>
) : (
    <button
      id="editdelete"
      onClick={() => {
        if (props.markDeleted) props.markDeleted(props.image.hash);
      }}
      className={
        props.image.toDelete
          ? "w-5 h-5 flex items-center justify-center rounded-sm bg-[#E5484D]"
          : "w-5 h-5 flex items-center justify-center rounded-sm bg-[#E5484D]"
      }
    >
      {props.image.toDelete ? (
        <IconRestore color="white" size="0.7rem"/>
      ) : (
        <IconTrash color="white" size="0.7rem"/>
      )}
    </button>
)}
  </div>
</div>
<div className="flex justify-between items-center w-full pt-1">

{props.image.classPredictions && props.image.classPredictions.length > 0 && props.image.classPredictions[0].class && (
  <Badge id="badgeclass" key={0} size="xs"  className="text-[#60646C] bg-[#EBEBEF]">
    {props.selectedModel === "Other" ? convertName(props.image.classPredictions[0].class) : props.image.classPredictions[0].class}
  </Badge>
)}
  



</div>


    </div>
  );
};

export default GalleryItem;
