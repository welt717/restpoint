// Field Factory - Create various field types

import type { CanvasField, FieldType } from '../types/index';

export class FieldFactory {
  private static fieldCounter: Record<FieldType, number> = {
    text: 0,
    multiline: 0,
    date: 0,
    number: 0,
    dropdown: 0,
    checkbox: 0,
    radio: 0,
    image: 0,
    qrcode: 0,
    barcode: 0,
    signature: 0,
    initials: 0,
  };

  static createField(
    type: FieldType,
    x: number = 50,
    y: number = 50
  ): CanvasField {
    const count = ++this.fieldCounter[type];
    const baseId = `${type}-${count}`;

    const baseField: CanvasField = {
      id: baseId,
      type,
      label: this.getDefaultLabel(type, count),
      required: false,
      readOnly: false,
      x,
      y,
      width: this.getDefaultWidth(type),
      height: this.getDefaultHeight(type),
      rotation: 0,
      fontSize: 12,
      fontFamily: 'Arial',
      fontColor: '#000000',
      backgroundColor: '#ffffff',
      borderColor: '#cccccc',
      borderWidth: 1,
      opacity: 1,
      locked: false,
      grouped: false,
    };

    // Type-specific defaults
    switch (type) {
      case 'text':
        return {
          ...baseField,
          placeholder: 'Enter text',
          defaultValue: '',
        };

      case 'multiline':
        return {
          ...baseField,
          placeholder: 'Enter text here...',
          height: 80,
        };

      case 'date':
        return {
          ...baseField,
          defaultValue: new Date().toISOString().split('T')[0],
          validation: { type: 'date' },
        };

      case 'number':
        return {
          ...baseField,
          placeholder: '0',
          validation: { type: 'number' },
        };

      case 'dropdown':
        return {
          ...baseField,
          dataSource: 'option1,option2,option3',
          defaultValue: 'option1',
        };

      case 'checkbox':
        return {
          ...baseField,
          width: 20,
          height: 20,
          label: 'Checkbox',
        };

      case 'radio':
        return {
          ...baseField,
          width: 20,
          height: 20,
          dataSource: 'option1,option2,option3',
        };

      case 'image':
        return {
          ...baseField,
          width: 150,
          height: 100,
          backgroundColor: '#f0f0f0',
        };

      case 'qrcode':
        return {
          ...baseField,
          width: 100,
          height: 100,
          dataSource: 'field-name',
        };

      case 'barcode':
        return {
          ...baseField,
          width: 150,
          height: 60,
          dataSource: 'field-name',
        };

      case 'signature':
        return {
          ...baseField,
          width: 200,
          height: 80,
          backgroundColor: '#fafafa',
          borderColor: '#999999',
        };

      case 'initials':
        return {
          ...baseField,
          width: 80,
          height: 40,
          backgroundColor: '#fafafa',
          borderColor: '#999999',
        };

      default:
        return baseField;
    }
  }

  private static getDefaultLabel(type: FieldType, count: number): string {
    const labels: Record<FieldType, string> = {
      text: 'Text Field',
      multiline: 'Multiline Text',
      date: 'Date',
      number: 'Number',
      dropdown: 'Dropdown',
      checkbox: 'Checkbox',
      radio: 'Radio Button',
      image: 'Image',
      qrcode: 'QR Code',
      barcode: 'Barcode',
      signature: 'Signature',
      initials: 'Initials',
    };
    return `${labels[type]} ${count}`;
  }

  private static getDefaultWidth(type: FieldType): number {
    const widths: Record<FieldType, number> = {
      text: 200,
      multiline: 300,
      date: 120,
      number: 100,
      dropdown: 150,
      checkbox: 20,
      radio: 20,
      image: 150,
      qrcode: 100,
      barcode: 150,
      signature: 200,
      initials: 80,
    };
    return widths[type];
  }

  private static getDefaultHeight(type: FieldType): number {
    const heights: Record<FieldType, number> = {
      text: 30,
      multiline: 80,
      date: 30,
      number: 30,
      dropdown: 30,
      checkbox: 20,
      radio: 20,
      image: 100,
      qrcode: 100,
      barcode: 60,
      signature: 80,
      initials: 40,
    };
    return heights[type];
  }

  static resetCounters(): void {
    Object.keys(this.fieldCounter).forEach((key) => {
      this.fieldCounter[key as FieldType] = 0;
    });
  }
}

export default FieldFactory;
