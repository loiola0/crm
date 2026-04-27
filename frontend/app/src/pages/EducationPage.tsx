import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { GraduationCap, Users } from 'lucide-react'
import { enrollmentStatuses } from '../lib/constants'
import { formatCurrency, formatDateTime } from '../lib/format'
import { formatEnrollmentStatus } from '../lib/labels'
import { createClassSession, createCourse, createEnrollment, getCourses, getEnrollments } from '../services/education'
import { getLeads } from '../services/leads'
import type { CreateClassSessionRequest, CreateEnrollmentRequest, EnrollmentStatus } from '../types/contracts'

type EnrollmentFormState = {
  leadId: string
  courseId: string
  classSessionId: string
  status: EnrollmentStatus
  amountPaid: number
  enrolledAtUtc: string
}

export function EducationPage() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [courseForm, setCourseForm] = useState({ name: '', description: '', price: 0, isActive: true })
  const [classForm, setClassForm] = useState({
    title: '',
    instructor: '',
    capacity: 30,
    startDateUtc: '',
    endDateUtc: '',
  })
  const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>({
    leadId: '',
    courseId: '',
    classSessionId: '',
    status: 'Pending',
    amountPaid: 0,
    enrolledAtUtc: '',
  })

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: getEnrollments,
  })

  const leadsQuery = useQuery({
    queryKey: ['education-leads'],
    queryFn: () => getLeads({ page: 1, pageSize: 100 }),
  })

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success('Curso criado com sucesso.')
      setCourseForm({ name: '', description: '', price: 0, isActive: true })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: () => toast.error('Falha ao criar o curso.'),
  })

  const createClassMutation = useMutation({
    mutationFn: () => {
      const payload: CreateClassSessionRequest = {
        ...classForm,
        startDateUtc: new Date(classForm.startDateUtc).toISOString(),
        endDateUtc: new Date(classForm.endDateUtc).toISOString(),
      }

      return createClassSession(selectedCourseId, payload)
    },
    onSuccess: () => {
      toast.success('Turma criada com sucesso.')
      setClassForm({ title: '', instructor: '', capacity: 30, startDateUtc: '', endDateUtc: '' })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
    onError: () => toast.error('Falha ao criar a turma.'),
  })

  const createEnrollmentMutation = useMutation({
    mutationFn: () => {
      const payload: CreateEnrollmentRequest = {
        ...enrollmentForm,
        classSessionId: enrollmentForm.classSessionId || null,
        enrolledAtUtc: enrollmentForm.enrolledAtUtc ? new Date(enrollmentForm.enrolledAtUtc).toISOString() : undefined,
      }

      return createEnrollment(payload)
    },
    onSuccess: () => {
      toast.success('Matricula criada com sucesso.')
      setEnrollmentForm({
        leadId: '',
        courseId: '',
        classSessionId: '',
        status: 'Pending',
        amountPaid: 0,
        enrolledAtUtc: '',
      })
      void queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      void queryClient.invalidateQueries({ queryKey: ['courses'] })
      void queryClient.invalidateQueries({ queryKey: ['lead'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: () => toast.error('Falha ao criar a matricula.'),
  })

  const selectedCourse = coursesQuery.data?.find((course) => course.id === enrollmentForm.courseId)

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Modulo educacional</p>
        <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">Cursos, turmas e matriculas</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
          Conecte o comercial com a operacao academica para que admissoes e entrega acompanhem o que foi vendido e o que esta sendo executado.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Cursos</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Visao geral do catalogo</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {coursesQuery.data?.map((course) => (
                <div key={course.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{course.name}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{course.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading text-2xl font-semibold text-slate-950">{formatCurrency(course.price)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{course.enrollmentCount} matriculas</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {course.classes.map((classItem) => (
                      <button
                        key={classItem.id}
                        type="button"
                        onClick={() => setSelectedCourseId(course.id)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition hover:border-orange-300"
                      >
                        <p className="font-semibold text-slate-900">{classItem.title}</p>
                        <p className="mt-1 text-slate-500">{formatDateTime(classItem.startDateUtc)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="eyebrow">Matriculas</p>
                <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Painel de alunos</h3>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {enrollmentsQuery.data?.map((enrollment) => (
                <div key={enrollment.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{enrollment.leadName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {enrollment.courseName}
                        {enrollment.classTitle ? ` - ${enrollment.classTitle}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      {formatEnrollmentStatus(enrollment.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{formatCurrency(enrollment.amountPaid)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel">
            <p className="eyebrow">Criar curso</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Lancar uma nova oferta</h3>
            <div className="mt-6 space-y-4">
              <input value={courseForm.name} onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })} placeholder="Nome do curso" className="input-field" />
              <textarea rows={4} value={courseForm.description} onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })} placeholder="Descreva a promessa e a estrutura do curso." className="input-field" />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" value={courseForm.price} onChange={(event) => setCourseForm({ ...courseForm, price: Number(event.target.value) })} placeholder="Preco" className="input-field" />
                <select value={String(courseForm.isActive)} onChange={(event) => setCourseForm({ ...courseForm, isActive: event.target.value === 'true' })} className="input-field">
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              <button type="button" onClick={() => createCourseMutation.mutate(courseForm)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Criar curso
              </button>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Criar turma</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Vincular uma turma a um curso</h3>
            <div className="mt-6 space-y-4">
              <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} className="input-field">
                <option value="">Selecione um curso</option>
                {coursesQuery.data?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <input value={classForm.title} onChange={(event) => setClassForm({ ...classForm, title: event.target.value })} placeholder="Nome da turma" className="input-field" />
              <input value={classForm.instructor} onChange={(event) => setClassForm({ ...classForm, instructor: event.target.value })} placeholder="Instrutor" className="input-field" />
              <div className="grid gap-4 md:grid-cols-3">
                <input type="number" value={classForm.capacity} onChange={(event) => setClassForm({ ...classForm, capacity: Number(event.target.value) })} placeholder="Capacidade" className="input-field" />
                <input type="datetime-local" value={classForm.startDateUtc} onChange={(event) => setClassForm({ ...classForm, startDateUtc: event.target.value })} className="input-field" />
                <input type="datetime-local" value={classForm.endDateUtc} onChange={(event) => setClassForm({ ...classForm, endDateUtc: event.target.value })} className="input-field" />
              </div>
              <button type="button" onClick={() => createClassMutation.mutate()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Criar turma
              </button>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">Criar matricula</p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-slate-950">Converter um lead em aluno</h3>
            <div className="mt-6 space-y-4">
              <select value={enrollmentForm.leadId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, leadId: event.target.value })} className="input-field">
                <option value="">Selecione um lead</option>
                {leadsQuery.data?.items.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.fullName}
                  </option>
                ))}
              </select>
              <select value={enrollmentForm.courseId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, courseId: event.target.value, classSessionId: '' })} className="input-field">
                <option value="">Selecione um curso</option>
                {coursesQuery.data?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <select value={enrollmentForm.classSessionId} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, classSessionId: event.target.value })} className="input-field">
                <option value="">Sem turma vinculada</option>
                {selectedCourse?.classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.title}
                  </option>
                ))}
              </select>
              <div className="grid gap-4 md:grid-cols-3">
                <select value={enrollmentForm.status} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, status: event.target.value as EnrollmentStatus })} className="input-field">
                  {enrollmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatEnrollmentStatus(status)}
                    </option>
                  ))}
                </select>
                <input type="number" value={enrollmentForm.amountPaid} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, amountPaid: Number(event.target.value) })} placeholder="Valor pago" className="input-field" />
                <input type="datetime-local" value={enrollmentForm.enrolledAtUtc} onChange={(event) => setEnrollmentForm({ ...enrollmentForm, enrolledAtUtc: event.target.value })} className="input-field" />
              </div>
              <button type="button" onClick={() => createEnrollmentMutation.mutate()} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Criar matricula
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
