import { type RefObject, useEffect, useRef } from 'react';

export function useOutsideClick(ref: RefObject<HTMLElement | null>, callback: () => void) {
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	useEffect(() => {
		function handleClick(e: PointerEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				callbackRef.current();
			}
		}
		document.addEventListener('pointerdown', handleClick);
		return () => document.removeEventListener('pointerdown', handleClick);
	}, [ref]);
}
