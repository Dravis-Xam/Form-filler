export interface CoordinateMatrix {
	referenceWidth: number
	referenceHeight: number
	targetWidth: number
	targetHeight: number
	scaleX: number
	scaleY: number
	uniformScale: number
}

export function createCoordinateMatrix(
	referenceWidth: number,
	referenceHeight: number,
	targetWidth: number,
	targetHeight: number,
): CoordinateMatrix {
	const scaleX = targetWidth / referenceWidth
	const scaleY = targetHeight / referenceHeight

	return {
		referenceWidth,
		referenceHeight,
		targetWidth,
		targetHeight,
		scaleX,
		scaleY,
		uniformScale: Math.min(scaleX, scaleY),
	}
}

export function scaleCoordinate(value: number, multiplier: number): number {
	return value * multiplier
}
