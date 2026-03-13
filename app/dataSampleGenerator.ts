

function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export const generateRandomSampleDataAlongACurve = (d: number, n = 100) => {
    var dataset: number[][][] = [];
    var datasetRes: number[][][] = [];


    for (let j = 0; j < n; j++) {
        var dataPoints: number[][] = []
        var results: number[][] = []

            for (let i = 0; i < d; i++) {

                const x = getRandomFloat(-10, 10)
                const y = getRandomFloat(-10, 10)

                dataPoints.push([x, y])

                const evaluatedFunc = [3 * x + y ** 2, y * 4 * x]
                const evaluatedFuncNorm = Math.sqrt(evaluatedFunc[0] ** 2 + evaluatedFunc[1] ** 2)
                results.push([evaluatedFunc[0] / evaluatedFuncNorm, evaluatedFunc[1] / evaluatedFuncNorm])

            }

        dataset.push(dataPoints)
        datasetRes.push(results)

    }


    return [dataset, datasetRes]
}