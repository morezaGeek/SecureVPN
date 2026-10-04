import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { UpdateInfo, UpdateProgress } from '../types/electron'

type Phase = 'idle' | 'downloading' | 'installing'
interface Updates {
    available: UpdateInfo | null
    checking: boolean
    checked: boolean
    phase: Phase
    percent: number
    error: string
    check: (silent?: boolean) => Promise<void>
    install: () => Promise<void>
}
const Context = createContext<Updates | null>(null)

export function UpdateProvider({ children }: { children: ReactNode }) {
    const [available, setAvailable] = useState<UpdateInfo | null>(null)
    const [checking, setChecking] = useState(false)
    const [checked, setChecked] = useState(false)
    const [phase, setPhase] = useState<Phase>('idle')
    const [percent, setPercent] = useState(0)
    const [error, setError] = useState('')
    const checkingRef = useRef(false)
    const installingRef = useRef(false)
    const lastCheck = useRef(0)

    const check = useCallback(async (silent = false) => {
        const api = window.electronAPI
        if (!api?.checkUpdate || checkingRef.current || installingRef.current) return
        checkingRef.current = true
        lastCheck.current = Date.now()
        setChecking(true)
        if (!silent) setError('')
        try {
            setAvailable(await api.checkUpdate())
            setChecked(true)
            setError('')
        } catch (err) {
            if (!silent) setError(String(err))
        } finally {
            checkingRef.current = false
            setChecking(false)
        }
    }, [])

    const install = useCallback(async () => {
        const api = window.electronAPI
        if (!api?.installUpdate || installingRef.current) return
        installingRef.current = true
        setPhase('downloading')
        setPercent(0)
        setError('')
        let unlisten: (() => void) | undefined
        try {
            // Subscribe before downloading so that early progress isn't missed.
            unlisten = await api.onUpdateProgress?.((progress: UpdateProgress) => {
                setPhase(progress.phase)
                setPercent(progress.total > 0 ? Math.min(100, Math.floor(progress.downloaded * 100 / progress.total)) : 0)
            })
            await api.installUpdate()
            setPhase('installing')
        } catch (err) {
            setError(String(err))
            setPhase('idle')
        } finally {
            unlisten?.()
            installingRef.current = false
        }
    }, [])

    useEffect(() => {
        void check(true)
        const timer = window.setInterval(() => { void check(true) }, 6 * 60 * 60 * 1000)
        const onFocus = () => {
            if (Date.now() - lastCheck.current > 60 * 60 * 1000) void check(true)
        }
        window.addEventListener('focus', onFocus)
        return () => {
            window.clearInterval(timer)
            window.removeEventListener('focus', onFocus)
        }
    }, [check])

    return <Context.Provider value={{ available, checking, checked, phase, percent, error, check, install }}>{children}</Context.Provider>
}

export function useUpdates() {
    const value = useContext(Context)
    if (!value) throw new Error('UpdateProvider is required')
    return value
}
