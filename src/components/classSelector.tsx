// classSelector.tsx

import React, { useEffect, useState } from "react";
import { FileInfo } from "./fileInfo";
import { Select } from '@mantine/core';
import { notClasses } from "./notClasses";
import { convertName } from "@/components/convertName";

interface ClassSelectorProps {
  file: FileInfo | undefined;
  classes: string[];
  onClassSet: (file: FileInfo, className: string) => void;
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string; 
}

const ClassSelector = (props: ClassSelectorProps) => {
  const closeModal = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const selectClass = (className: string) => {
    if (props.file) {
      props.onClassSet(props.file, className);
      props.onClose();
    }
  };

  let displayedClassNames = new Set();
  const filteredClasses = props.classes.filter(className => !notClasses.includes(className)).map((className, idx) => {
    const displayClassName = props.selectedModel === "Other" ? convertName(className) : className;
    if (displayClassName === "Unknown" || displayedClassNames.has(displayClassName)) return null;
    displayedClassNames.add(displayClassName);
    return (
      <li
        key={idx}
        className="py-2 px-4 cursor-pointer hover:bg-gray-100"
        onClick={() => selectClass(className)}
      >
        {displayClassName}
      </li>
    );
  });

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${
        props.isOpen && props.classes.length > 0 ? "block" : "hidden"
      }`}
      onClick={closeModal}
    >
      <div className="bg-white rounded-lg p-6 w-80">
        <h2 className="text-lg mb-4">Select new class</h2>
        <ul className="divide-y divide-gray-200 overflow-y-auto max-h-96">
          {filteredClasses}
        </ul>
      </div>
    </div>
  );
};

export default ClassSelector;