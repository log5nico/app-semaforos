import { supabase } from './supabase'

export const db = {
  entities: {
    DescripcionPredefinida: {
      list: async () => {
        const { data, error } = await supabase
          .from('descripcion_predefinida')
          .select('*')
          .order('orden')

        if (error) throw error

        return data
      }
    },

    ClasificacionIncidencia: {
      list: async () => {
        const { data, error } = await supabase
          .from('clasificacion_incidencia')
          .select('*')
          .order('orden')

        if (error) throw error

        return data
      }
    }
  }
}
