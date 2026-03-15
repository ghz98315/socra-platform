export type AvatarRole = 'student' | 'parent';
export type AvatarGender = 'male' | 'female';

export interface AvatarOption {
  id: string;
  label: string;
  role: AvatarRole;
  gender: AvatarGender;
  src: string;
  accent: string;
}

export const avatarOptions: AvatarOption[] = [
  {
    id: 'student-girl-bunny',
    label: '学生 兔兔',
    role: 'student',
    gender: 'female',
    src: '/avatars/student-girl-bunny.svg',
    accent: 'from-rose-100 to-pink-100',
  },
  {
    id: 'student-boy-lion',
    label: '学生 小狮子',
    role: 'student',
    gender: 'male',
    src: '/avatars/student-boy-lion.svg',
    accent: 'from-amber-100 to-orange-100',
  },
  {
    id: 'student-girl-cat',
    label: '学生 小猫咪',
    role: 'student',
    gender: 'female',
    src: '/avatars/student-girl-cat.svg',
    accent: 'from-fuchsia-100 to-rose-100',
  },
  {
    id: 'student-boy-fox',
    label: '学生 小狐狸',
    role: 'student',
    gender: 'male',
    src: '/avatars/student-boy-fox.svg',
    accent: 'from-orange-100 to-yellow-100',
  },
  {
    id: 'parent-mom-swan',
    label: '家长 温柔妈妈',
    role: 'parent',
    gender: 'female',
    src: '/avatars/parent-mom-swan.svg',
    accent: 'from-violet-100 to-purple-100',
  },
  {
    id: 'parent-dad-bear',
    label: '家长 熊爸',
    role: 'parent',
    gender: 'male',
    src: '/avatars/parent-dad-bear.svg',
    accent: 'from-sky-100 to-cyan-100',
  },
  {
    id: 'parent-mom-deer',
    label: '家长 鹿妈妈',
    role: 'parent',
    gender: 'female',
    src: '/avatars/parent-mom-deer.svg',
    accent: 'from-pink-100 to-rose-100',
  },
  {
    id: 'parent-dad-owl',
    label: '家长 猫头鹰爸爸',
    role: 'parent',
    gender: 'male',
    src: '/avatars/parent-dad-owl.svg',
    accent: 'from-emerald-100 to-teal-100',
  },
];

export const defaultAvatarByRole: Record<AvatarRole, string> = {
  student: avatarOptions.find((option) => option.role === 'student')?.src || '',
  parent: avatarOptions.find((option) => option.role === 'parent')?.src || '',
};
