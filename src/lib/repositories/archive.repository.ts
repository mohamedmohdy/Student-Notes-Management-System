import { GradeRepository } from './grade.repository';
import { ClassRepository } from './class.repository';
import { StudentRepository } from './student.repository';
import { NoteRepository } from './note.repository';

export const ArchiveRepository = {
  restore: async (type: "grade" | "class" | "student" | "note", id: string, teacherId: string): Promise<boolean> => {
    if (type === "grade") return GradeRepository.restore(id, teacherId);
    if (type === "class") return ClassRepository.restore(id, teacherId);
    if (type === "student") return StudentRepository.restore(id, teacherId);
    if (type === "note") return NoteRepository.restore(id, teacherId);
    return false;
  },

  getAllArchived: async (teacherId: string) => {
    return ArchiveRepository.getAll(teacherId);
  },
  getAll: async (teacherId: string) => {
    const grades = (await GradeRepository.getAll({ includeArchived: true, teacherId })).filter((g) => g.archived === 1);
    const classes = (await ClassRepository.getAll({ includeArchived: true, teacherId })).filter((c) => c.archived === 1);
    const students = (await StudentRepository.getAll({ includeArchived: true, teacherId })).filter((s) => s.archived === 1);
    const notes = (await NoteRepository.getAll({ includeArchived: true, teacherId })).filter((n) => n.archived === 1);

    return {
      grades,
      classes,
      students,
      notes,
    };
  },
};
