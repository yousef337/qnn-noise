import QuantumCircuit from 'quantum-circuit';
import { norm, NDArray, array } from 'vectorious';


const generalNNCircuit = (noise: NDArray,) => {
    var circuit = new QuantumCircuit(1);

    // construct NN circuit

    for (var idx = 0; idx < noise.shape[1]; idx++) {
        for (var layer = 0; layer < noise.shape[0]; layer++) {
            circuit.appendGate("ry", layer, { "params": { "theta": noise.get(layer, idx) } });
            circuit.appendGate("rx", layer, { "params": { "theta": noise.get(layer, idx) } });
        }

    }

    return circuit;

}


// Return new noise
export const optimizer = (dataPointsResults: number[][][], dataPointsNNResults: number[][], noise: NDArray) => {

    // console.warn(dataPointsResults.length)
    // console.warn(dataPointsResults[0].length)

    // console.warn(dataPointsNNResults.length)
    // console.warn(dataPointsNNResults[0].length)

    // console.warn(noise.shape)

    var newNoise: NDArray = noise.copy()

    for (var i = 0; i < dataPointsResults.length; i++) {

        // Iterate over all qubits
        for (var j = 0; j < dataPointsResults[i].length; j++) {
            var lr = 0.1// Math.random()

            // if (Math.random() < 0.5)
            //     lr = -lr;

            // apply real and imag shift
            const dataPointRestI = new NDArray(dataPointsResults[i][j])
            const dataPointNNRestI = new NDArray(dataPointsNNResults[i][j]).scale(-1)

            // console.warn("--norm(dataPointRestI)")
            // console.warn(norm(dataPointNNRestI))
            // console.warn(dataPointRestI.data)
            // console.warn(dataPointNNRestI.data)
            // TODO: Add only to the prespective row
            newNoise.slice(j, 1).add([lr * norm(dataPointRestI.add(dataPointNNRestI))])
            newNoise = array(newNoise.data.map(x => x % 8));
            newNoise.reshape(...noise.shape)
 
        }


    
    }

    return newNoise 

}


/**
 * Execute a quantum circuit for all data points and noice, and get the results to an optimizer
 */
export const buildQuantumCircuit = (dataPoints: number[][][], noise: NDArray, iteration = 10) => {
    const baseCircuit = generalNNCircuit(noise)
    const dataPointsNNResults: number[][][] = []
    var simInstance = new QuantumCircuit(1);


    for (var dataPointIdx = 0; dataPointIdx < dataPoints.length; dataPointIdx++) {
        const dataPointsInteriumNNResults: number[][] = []

        simInstance = new QuantumCircuit(1);
        for (var qIdx = 0; qIdx < dataPoints[0].length; qIdx++) {
            // Initialize vector
            simInstance.appendGate("rx", qIdx, { "params": { "theta": dataPoints[dataPointIdx][qIdx][0] } });
            simInstance.appendGate("ry", qIdx, { "params": { "theta": dataPoints[dataPointIdx][qIdx][1] } });
            simInstance.appendGate("barrier", qIdx, false);
        }
        // Merge baseCircuit
    
        simInstance.appendCircuit(baseCircuit, false)
    
        // Run simulation        
        simInstance.run();
        // console.warn(simInstance.probabilities())
        const reals = simInstance.probabilities()

        for (var qIdx = 0; qIdx < dataPoints[0].length; qIdx++) {
            simInstance.appendGate("barrier", qIdx, false);
            // Initialize vector
            simInstance.appendGate("sdg", qIdx, false);
            simInstance.appendGate("h", qIdx, false);
            simInstance.appendGate("barrier", qIdx, false);
        }
        simInstance.run();
        // console.warn(simInstance.probabilities())

        const imag = simInstance.probabilities()


        for (var i = 0; i <imag.length; i++) {
            dataPointsInteriumNNResults.push([reals[i], imag[i]])
        }

        dataPointsNNResults.push(dataPointsInteriumNNResults)

    }

    // Store results

    // redo simulation, calculate errors

    return [simInstance.exportToSVG(false), dataPointsNNResults, simInstance];

}