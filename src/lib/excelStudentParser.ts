import { StudentStatus } from '@/lib/types';

export interface ParsedStudentRow {
  student_number: string;
  name: string;
  status: StudentStatus;
  grade_name?: string;
  class_name?: string;
  is_valid: boolean;
  is_duplicate: boolean;
  validation_error?: string;
  raw_row_index: number;
}

export interface ParseExcelResult {
  success: boolean;
  total_rows: number;
  valid_count: number;
  duplicate_count: number;
  invalid_count: number;
  students: ParsedStudentRow[];
  headers_found: {
    name_header: string | null;
    number_header: string | null;
    status_header: string | null;
    grade_header: string | null;
    class_header: string | null;
  };
  error_message?: string;
}

// Normalize a header key for fuzzy matching
export function normalizeHeaderKey(key: any): string {
  if (key === null || key === undefined) return '';
  return key
    .toString()
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ') // Normalize spaces
    .replace(/[ـ_\\/\-\.\:\(\)\[\]]/g, '') // Remove tatweel, punctuation, parentheses
    .replace(/\s+/g, '') // Remove all spaces
    .toLowerCase()
    .trim();
}

// Clean text data (preserves Arabic characters and normalizes repeated whitespace)
export function cleanCellText(value: any): string {
  if (value === null || value === undefined) return '';
  const str = value.toString();
  return str
    .replace(/^\uFEFF/, '')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Known semantic aliases
const NAME_ALIASES = [
  'اسمالطالب',
  'اسمالطالبالرباعي',
  'اسمالطالبالثلاثي',
  'اسمالطالبالكامل',
  'الاسمكامل',
  'الاسمبالكامل',
  'الاسم',
  'اسمالتلميذ',
  'اسمالتلميذالرباعي',
  'اسمالدارس',
  'الطالب',
  'طالب',
  'التلميذ',
  'تلميذ',
  'name',
  'studentname',
  'studentfullname',
  'fullname',
  'student',
  'pupilname',
];

const NUMBER_ALIASES = [
  'رقمالطالب',
  'الرقمالاكاديمي',
  'الرقم',
  'رقمجلوس',
  'رقمالسجل',
  'الهوية',
  'رقمالهوية',
  'السجلالمدني',
  'رقم',
  'id',
  'studentid',
  'studentnumber',
  'studentno',
  'number',
  'no',
  'academicid',
  'nationalid',
];

const STATUS_ALIASES = [
  'الحالة',
  'حالةالطالب',
  'التقييم',
  'مستوىالطالب',
  'status',
  'studentstatus',
];

const GRADE_ALIASES = [
  'الصف',
  'الصفالدراسي',
  'المرحلة',
  'المرحلةالدراسية',
  'grade',
  'gradename',
];

const CLASS_ALIASES = [
  'الفصل',
  'الفصلالدراسي',
  'الشعبة',
  'class',
  'classname',
  'section',
  'classroom',
];

export function parseExcelStudentData(
  sheetJson: any[][],
  existingClassStudentNumbers: Set<string> = new Set(),
  existingClassStudentNames: Set<string> = new Set()
): ParseExcelResult {
  if (!Array.isArray(sheetJson) || sheetJson.length === 0) {
    return {
      success: false,
      total_rows: 0,
      valid_count: 0,
      duplicate_count: 0,
      invalid_count: 0,
      students: [],
      headers_found: {
        name_header: null,
        number_header: null,
        status_header: null,
        grade_header: null,
        class_header: null,
      },
      error_message: 'ملف Excel فارغ ولا يحتوي على أي بيانات',
    };
  }

  // 1. Locate Header Row (Scan top 10 rows for a row containing a student name header)
  let headerRowIndex = -1;
  let nameColIdx = -1;
  let numberColIdx = -1;
  let statusColIdx = -1;
  let gradeColIdx = -1;
  let classColIdx = -1;

  for (let r = 0; r < Math.min(sheetJson.length, 10); r++) {
    const row = sheetJson[r];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const normalized = normalizeHeaderKey(row[c]);
      if (NAME_ALIASES.includes(normalized)) {
        headerRowIndex = r;
        break;
      }
    }
    if (headerRowIndex !== -1) break;
  }

  if (headerRowIndex === -1) {
    return {
      success: false,
      total_rows: 0,
      valid_count: 0,
      duplicate_count: 0,
      invalid_count: 0,
      students: [],
      headers_found: {
        name_header: null,
        number_header: null,
        status_header: null,
        grade_header: null,
        class_header: null,
      },
      error_message: 'لم يتم العثور على عمود "اسم الطالب" في الملف. يرجى التأكد من تسمية العمود بـ "اسم الطالب" أو "Student Name".',
    };
  }

  // 2. Identify Column Indices from the detected Header Row
  const headerRow = sheetJson[headerRowIndex];
  for (let c = 0; c < headerRow.length; c++) {
    const normalized = normalizeHeaderKey(headerRow[c]);
    if (nameColIdx === -1 && NAME_ALIASES.includes(normalized)) {
      nameColIdx = c;
    } else if (numberColIdx === -1 && NUMBER_ALIASES.includes(normalized)) {
      numberColIdx = c;
    } else if (statusColIdx === -1 && STATUS_ALIASES.includes(normalized)) {
      statusColIdx = c;
    } else if (gradeColIdx === -1 && GRADE_ALIASES.includes(normalized)) {
      gradeColIdx = c;
    } else if (classColIdx === -1 && CLASS_ALIASES.includes(normalized)) {
      classColIdx = c;
    }
  }

  // 3. Parse Data Rows
  const parsedRows: ParsedStudentRow[] = [];
  const seenNumbersInFile = new Set<string>();
  const seenNamesInFile = new Set<string>();
  let autoNumberCounter = 101;

  for (let r = headerRowIndex + 1; r < sheetJson.length; r++) {
    const row = sheetJson[r];
    if (!Array.isArray(row)) continue;

    // Check if entire row is empty
    const hasAnyContent = row.some((cell) => cell !== null && cell !== undefined && cleanCellText(cell).length > 0);
    if (!hasAnyContent) continue;

    const rawName = nameColIdx !== -1 ? row[nameColIdx] : '';
    const rawNumber = numberColIdx !== -1 ? row[numberColIdx] : '';
    const rawStatus = statusColIdx !== -1 ? row[statusColIdx] : '';
    const rawGrade = gradeColIdx !== -1 ? row[gradeColIdx] : '';
    const rawClass = classColIdx !== -1 ? row[classColIdx] : '';

    const name = cleanCellText(rawName);
    let studentNumber = cleanCellText(rawNumber);
    const gradeName = cleanCellText(rawGrade);
    const className = cleanCellText(rawClass);

    // If student number is missing in file, assign synthetic unique counter
    if (!studentNumber) {
      while (
        seenNumbersInFile.has(String(autoNumberCounter)) ||
        existingClassStudentNumbers.has(String(autoNumberCounter))
      ) {
        autoNumberCounter++;
      }
      studentNumber = String(autoNumberCounter++);
    }

    // Determine status
    let status: StudentStatus = 'normal';
    const statusText = cleanCellText(rawStatus).toLowerCase();
    if (statusText.includes('ممتاز') || statusText.includes('excel')) {
      status = 'excellent';
    } else if (statusText.includes('متابع') || statusText.includes('follow') || statusText.includes('ضعيف')) {
      status = 'needs_followup';
    }

    // Validation & Duplication Check
    let isValid = true;
    let isDuplicate = false;
    let validationError: string | undefined;

    if (!name || name.length === 0) {
      isValid = false;
      validationError = 'اسم الطالب مفقود أو فارغ';
    } else if (seenNumbersInFile.has(studentNumber) || seenNamesInFile.has(name)) {
      isDuplicate = true;
      isValid = false;
      validationError = 'طالب مكرر في نفس الملف';
    } else if (existingClassStudentNumbers.has(studentNumber) || existingClassStudentNames.has(name)) {
      isDuplicate = true;
      isValid = false;
      validationError = 'طالب موجود مسبقاً في هذا الفصل';
    }

    if (name) {
      seenNamesInFile.add(name);
      seenNumbersInFile.add(studentNumber);
    }

    parsedRows.push({
      student_number: studentNumber,
      name,
      status,
      grade_name: gradeName || undefined,
      class_name: className || undefined,
      is_valid: isValid,
      is_duplicate: isDuplicate,
      validation_error: validationError,
      raw_row_index: r + 1,
    });
  }

  const validCount = parsedRows.filter((r) => r.is_valid).length;
  const duplicateCount = parsedRows.filter((r) => r.is_duplicate).length;
  const invalidCount = parsedRows.filter((r) => !r.is_valid && !r.is_duplicate).length;

  return {
    success: validCount > 0 || parsedRows.length > 0,
    total_rows: parsedRows.length,
    valid_count: validCount,
    duplicate_count: duplicateCount,
    invalid_count: invalidCount,
    students: parsedRows,
    headers_found: {
      name_header: nameColIdx !== -1 ? String(headerRow[nameColIdx]) : null,
      number_header: numberColIdx !== -1 ? String(headerRow[numberColIdx]) : null,
      status_header: statusColIdx !== -1 ? String(headerRow[statusColIdx]) : null,
      grade_header: gradeColIdx !== -1 ? String(headerRow[gradeColIdx]) : null,
      class_header: classColIdx !== -1 ? String(headerRow[classColIdx]) : null,
    },
    error_message:
      parsedRows.length === 0
        ? 'لم يتم العثور على أي صفوف طلاب صالحة بعد رأس الجدول'
        : validCount === 0
        ? 'جميع الصفوف المكتشفة في الملف إما مكررة أو غير مكتملة'
        : undefined,
  };
}
