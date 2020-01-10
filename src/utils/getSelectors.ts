function loopObjectForSelectors(obj: any, objRefs: object[] = []): string[] {
	const selectors: string[] = []

	Object.keys(obj).forEach(key => {
		const value: any = obj[key]
		if (key === 'selector') {
			let cleanedValue: string = value.trim()
			if (cleanedValue.startsWith('.')) {
				cleanedValue = cleanedValue.substr(1)
			}
			selectors.push(cleanedValue)
			return
		}

		if (value instanceof Array) {
			value.forEach(item => {
				if (typeof item === 'object') {
					if (objRefs.findIndex(ref => ref === value) === -1) {
						objRefs.push(value)
						selectors.push(...loopObjectForSelectors(value, objRefs))
						return
					}
				}
			})
		} else if (typeof value === 'object') {
			if (objRefs.findIndex(ref => ref === value) === -1) {
				objRefs.push(value)
				selectors.push(...loopObjectForSelectors(value, objRefs))
				return
			}
		}
	})

	return selectors
}

export default function getSelectors(styles: any[]) {
	return [
		...new Set(
			styles.reduce((acc, style) => {
				const selectors = loopObjectForSelectors(style)
				acc.push(...selectors)
				return acc
			}, [])
		),
	] as string[]
}
