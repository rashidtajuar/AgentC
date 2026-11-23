import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useStore } from 'zustand'
import type { CanvasPort } from '../canvas/port'
import type { Board } from '../core/types'
import type { DemoState, DemoStore } from './demoStore'

interface DemoCtx {
	store: DemoStore
	port: CanvasPort
}

const Ctx = createContext<DemoCtx | null>(null)

export function DemoProvider({ value, children }: { value: DemoCtx | null; children: ReactNode }) {
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useDemoCtx() {
	return useContext(Ctx)
}

/** Select from the demo store; returns `fallback` before the canvas has mounted. */
export function useDemo<T>(selector: (s: DemoState) => T, fallback: T): T {
	const ctx = useContext(Ctx)
	const store = ctx?.store
	const value = useStore((store ?? EMPTY_STORE) as DemoStore, selector as (s: DemoState) => T)
	return store ? value : fallback
}

/** Live board snapshot, refreshed at most once per frame. */
export function useBoard(): Board | null {
	const ctx = useContext(Ctx)
	const [board, setBoard] = useState<Board | null>(() => ctx?.port.read() ?? null)
	useEffect(() => {
		if (!ctx) return
		let raf = 0
		setBoard(ctx.port.read())
		const off = ctx.port.onChange(() => {
			if (raf) return
			raf = requestAnimationFrame(() => {
				raf = 0
				setBoard(ctx.port.read())
			})
		})
		return () => {
			off()
			if (raf) cancelAnimationFrame(raf)
		}
	}, [ctx])
	return board
}

const EMPTY_STORE = {
	getState: () => ({}) as DemoState,
	getInitialState: () => ({}) as DemoState,
	subscribe: () => () => {},
	setState: () => {},
}
