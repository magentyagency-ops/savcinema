import ky from 'ky'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'

export interface TMDBMedia {
    id: number
    title?: string
    name?: string
    overview: string
    poster_path: string | null
    release_date?: string
    first_air_date?: string
    vote_average: number
    media_type: 'movie' | 'tv' | 'person'
}

export interface TMDBResponse {
    page: number
    results: TMDBMedia[]
    total_pages: number
}

const api = ky.create({
    prefixUrl: BASE_URL,
    headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
    },
    searchParams: {
        language: 'fr-FR',
    },
})

export const searchMedia = async (query: string): Promise<TMDBMedia[]> => {
    if (!query) return []

    try {
        const response = await api.get('search/multi', {
            searchParams: { query },
        }).json<TMDBResponse>()

        // Filter out people and keep only movies/tv
        return response.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    } catch (error) {
        console.error('TMDB Search Error:', error)
        return []
    }
}

export const getMedia = async (id: number, type: 'movie' | 'tv'): Promise<TMDBMedia | null> => {
    try {
        const response = await api.get(`${type}/${id}`).json<TMDBMedia>()
        // Normalize response to always have a type
        return { ...response, media_type: type }
    } catch (error) {
        console.error('TMDB Get details Error:', error)
        return null
    }
}
