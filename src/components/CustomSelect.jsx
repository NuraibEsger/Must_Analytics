import React from 'react';
import Select from 'react-select';

const CustomSelect = ({ annotation, labelsData, handleLabelChange, selectedAnnotationId, isEditor }) => {
  const options = labelsData
    ? labelsData.map((label) => ({
        value: label._id,
        label: label.name,
        isDisabled: annotation.label?._id === label._id,
      }))
    : [];

  const customStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#D1D5DB',
      borderRadius: '8px',
      padding: '0 10px',
      minHeight: '40px',
      backgroundColor: isEditor ? 'white' : '#E5E7EB',
      cursor: isEditor ? 'pointer' : 'not-allowed',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#A0AEC0',
      },
      minWidth: '160px', // Static width for the dropdown
    }),
    option: (styles, { data, isDisabled, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected
        ? '#E0F7FA'
        : isDisabled
        ? '#F1F5F9'
        : 'transparent',
      color: isDisabled ? '#9CA3AF' : '#4A5568',
      padding: '10px',
      minWidth: '160px', // Ensure option width is static
      maxWidth: '160px', // Option width does not expand beyond this
      whiteSpace: 'nowrap', // Prevent text wrapping
      overflow: 'hidden',
      textOverflow: 'ellipsis', // Add ellipsis for long text
    }),
    singleValue: (styles) => ({
      ...styles,
      color: '#4A5568',
    }),
  };

  return (
    <div>
      <Select
        isDisabled={!isEditor}
        value={options.find((option) => option.value === annotation.label?._id) || null}
        onChange={(selectedOption) =>
          handleLabelChange(annotation._id, selectedOption.value)
        }
        options={options}
        styles={customStyles}
        placeholder="Select Label"
        aria-label={`Select Label for Annotation ${annotation._id}`}
      />
    </div>
  );
};

export default CustomSelect;
