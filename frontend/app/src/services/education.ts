import { api } from './api'
import type {
  Course,
  CreateClassSessionRequest,
  CreateCourseRequest,
  CreateEnrollmentRequest,
  Enrollment,
} from '../types/contracts'

export async function getCourses() {
  const { data } = await api.get<Course[]>('/courses')
  return data
}

export async function createCourse(payload: CreateCourseRequest) {
  const { data } = await api.post<Course>('/courses', payload)
  return data
}

export async function createClassSession(courseId: string, payload: CreateClassSessionRequest) {
  const { data } = await api.post(`/courses/${courseId}/classes`, payload)
  return data
}

export async function getEnrollments() {
  const { data } = await api.get<Enrollment[]>('/enrollments')
  return data
}

export async function createEnrollment(payload: CreateEnrollmentRequest) {
  const { data } = await api.post<Enrollment>('/enrollments', payload)
  return data
}
