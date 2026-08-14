// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/admin`
  | `/chat`
  | `/check`
  | `/household`
  | `/login`
  | `/profile`
  | `/register`
  | `/results`
  | `/schemes/:slug`
  | `/vault`
  | `/voice`

export type Params = {
  '/schemes/:slug': { slug: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
