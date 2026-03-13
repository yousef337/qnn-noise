"use client"

import { generateRandomSampleDataAlongACurve } from "./dataSampleGenerator";
import { buildQuantumCircuit, optimizer } from "./quantumCircuit";
import { randomNoise } from "./noise";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Line, Legend } from 'recharts';
import { ndarrayToNested } from "./noise";
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { useEffect, useState } from "react";
import { Label, NumberField } from "@heroui/react";
import { NDArray, norm } from "vectorious";


function matrixToHeatMapData(matrix) {
  return matrix.map((row, rowIndex) =>
  ({
    id: `R${rowIndex}`,
    data: row.map((value, colIndex) => ({
      x: `C${colIndex}`,
      y: value
    }))
  })
  );
}

const handleDownload = (text, filename = "OpenQASM.qasm") => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export default function Home() {

  const [numQubits, setNumQubits] = useState(5);
  const [numData, setNumData] = useState(10);
  const [selectedQubit, setSelectedQubit] = useState(0);

  const [initialDataset, initialDatasetRes] = generateRandomSampleDataAlongACurve(numQubits, numData);

  const [dataset, setDataset] = useState(initialDataset);
  const [circuitDepth, setCircuitDepth] = useState(5);
  const [datasetRes, setDatasetRes] = useState(initialDatasetRes);
  const [currentNoise, setCurrentNoise] = useState(randomNoise(numQubits, circuitDepth));
  const [errVt, setErrVt] = useState<number[]>([]);

  const [initialSvg, initialDataPointsNNResults, initialSimInstance] = buildQuantumCircuit(dataset, currentNoise, 1)

  const [svg, setSvg] = useState(initialSvg);
  const [dataPointsNNResults, setDataPointsNNResults] = useState(initialDataPointsNNResults);
  const [simInstance, setSimInstance] = useState(initialSimInstance);

  useEffect(() => {
    const noise = randomNoise(numQubits, circuitDepth)
    const [initialDataset, initialDatasetRes] = generateRandomSampleDataAlongACurve(numQubits, numData);
    const [initialSvg, initialDataPointsNNResults, initialSimInstance] = buildQuantumCircuit(initialDataset, noise, 1)

    setCurrentNoise(noise)
    setDataset(initialDataset)
    setDatasetRes(initialDatasetRes)
    setSvg(initialSvg)
    setDataPointsNNResults(initialDataPointsNNResults)
    setSimInstance(initialSimInstance)

    calculateNNError()

  }, [numQubits, numData, circuitDepth])

  const calculateNNError = () => {

    var accumulatedError = 0;
    for (var i = 0; i < datasetRes.length; i++) {
      for (var j = 0; j < datasetRes[i].length; j++) {
        const q1 = new NDArray(datasetRes[i][j])
        const q1NN = new NDArray(dataPointsNNResults[i][j])

        accumulatedError += norm(q1) - norm(q1NN)
      }
    }

    setErrVt((e) => [...e, accumulatedError])
  }

  const stepNoiseOptimize = () => {
    const newNoise = optimizer(datasetRes, dataPointsNNResults, currentNoise);

    const [initialSvg, initialDataPointsNNResults, initialSimInstance] = buildQuantumCircuit(dataset, newNoise, 1)


    setSvg(initialSvg)
    setDataPointsNNResults(initialDataPointsNNResults)
    setSimInstance(initialSimInstance)
    setCurrentNoise(newNoise)
    
    calculateNNError()

  };

  const formattedData = dataset.map(point => ({
    x: point[selectedQubit][0],
    y: point[selectedQubit][1]
  }));


  const formattedDataRes = datasetRes.map(point => ({
    x: point[selectedQubit][0],
    y: point[selectedQubit][1]
  }));

  const formattedDataNNRes = dataPointsNNResults.map(point => ({
    x: point[selectedQubit][0],
    y: point[selectedQubit][1]
  }));


  const errorData = errVt.map((time, index) => ({
    x: index,
    y: errVt[index]
  }));



  return (
    <div className="bg-white m-8">

      <div className="flex">
        <NumberField onChange={(n) => setNumData(n)} className="w-full max-w-64 text-black" value={numData} minValue={10} maxValue={100} name="width">
          <Label>Number of data</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input className="w-8 mx-2" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

        <NumberField onChange={(n) => setNumQubits(n)} className="w-full max-w-64 text-black" value={numQubits} minValue={1} maxValue={5} name="width">
          <Label>Number of qubits per data entry</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input className="w-2 mx-2" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>


        <NumberField onChange={(n) => setCircuitDepth(n)} className="w-full mx-2 max-w-64 text-black" value={circuitDepth} minValue={1} maxValue={10} name="width">
          <Label>Circuit Depth</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input className="w-2 mx-2" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>

      </div>

      <div className="flex">

        <div dangerouslySetInnerHTML={{ __html: svg }} />

        <div className="w-96 h-80 ml-auto mr-16 border border-1 border-black p-1">
          <text className="text-black p-9">
            A heatmap that represents the applied noise transformation, as a rotational, matrix on the quantum cirucit over iterations
          </text>
          <ResponsiveHeatMap
            key={JSON.stringify((currentNoise))}
            forceSquare
            data={matrixToHeatMapData(ndarrayToNested(currentNoise))}
            colors={{ type: "sequential", scheme: "greys" }}
            keys={ndarrayToNested(currentNoise)[0].map((_, i) => String(i))}
            enableLabels={false}
            indexBy="id"

          />

        </div>

      </div>

      <div className="ml-4">
        <button className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-heading rounded-base group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 mx-8"
          onClick={() => stepNoiseOptimize()}>
          <span className=" relative px-4 py-2.5 transition-all ease-in duration-75 bg-neutral-primary-soft rounded-base group-hover:bg-transparent group-hover:dark:bg-transparent leading-5">
            Step
          </span>
        </button>

        <button className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-heading rounded-base group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800" onClick={() => handleDownload(simInstance.exportToQASM({ comment: "" }, false, false, false))}>
          <span className=" relative px-4 py-2.5 transition-all ease-in duration-75 bg-neutral-primary-soft rounded-base group-hover:bg-transparent group-hover:dark:bg-transparent leading-5">
            Export Circuit to OpenQASM
          </span>
        </button>
      </div>


      <NumberField onChange={(n) => setSelectedQubit(n)} className="w-full mt-16 max-w-64 text-black" value={selectedQubit} minValue={0} maxValue={numQubits - 1} name="width">
        <Label>Selected Qubit starting from 0</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input className="w-2 mx-2" />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>


      <div className=" flex mt-4">

        <div>
          <text className="text-black">Locations of locations of the training dataset</text>
          <ResponsiveContainer width="95%" height={400}>
            <ScatterChart className="mx-8 my-4" width={600} height={500} margin={{ top: 4, right: 4, bottom: -4, left: -4 }} title="Locations of locations of the training dataset">

              <text
                x='50%'
                y='95%'
                dy={+20}
                style={{ fontSize: 24, fill: '#000000ff' }}
                width={200}
                textAnchor='middle'
              >Real Component</text>

              <text
                x='3%'
                y='50%'
                dy={+20}
                style={{ fontSize: 24, fill: '#000000ff', writingMode: 'vertical-rl' }}
                width={200}
                textAnchor='middle'
              >Imaginary Component</text>

              <CartesianGrid />

              <XAxis type="number" dataKey="x" name="X" />
              <YAxis type="number" dataKey="y" name="Y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={formattedData} fill="#810404ff" />
            </ScatterChart>
          </ResponsiveContainer>

        </div>

        <div className="mx-16">

          <text className="text-black">Locations of locations of the actual vs trained transformation of the dataset</text>
          <ResponsiveContainer width="50%" height={400}>

            <ScatterChart className="mx-8 my-4" width={600} height={500} margin={{ top: 4, right: 4, bottom: -4, left: -4 }} title="Presentation of locations of actual (Crimson) vs estimated (Blue) transformation">


              <text
                x='50%'
                y='95%'
                dy={+20}
                style={{ fontSize: 24, fill: '#000000ff' }}
                width={200}
                textAnchor='middle'
              >Real Component</text>

              <text
                x='3%'
                y='50%'
                dy={+20}
                style={{ fontSize: 24, fill: '#000000ff', writingMode: 'vertical-rl' }}
                width={200}
                textAnchor='middle'
              >Imaginary Component</text>

              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="X" />
              <YAxis type="number" dataKey="y" name="Y" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={formattedDataNNRes} fill="#4237e0ff" />
              <Scatter data={formattedDataRes} fill="#810404ff" />
            </ScatterChart>
          </ResponsiveContainer>

        </div>
      </div>

      <div className="mt-16">

        <text className="text-black">Change in MSRE Over Noise-based Training Iterations</text>
        <ResponsiveContainer width="50%" height={400}>

          <LineChart className="mx-8 my-4" width={500} height={400} margin={{ top: 4, right: 4, bottom: -4, left: -4 }} data={errorData} title="MSRE Over Iterations">

            <text
              x='50%'
              y='95%'
              dy={+20}
              style={{ fontSize: 16, fill: '#000000ff' }}
              width={200}
              textAnchor='middle'
            >Iteration</text>

            <text
              x='3%'
              y='50%'
              dy={+20}
              style={{ fontSize: 16, fill: '#000000ff', writingMode: 'vertical-rl' }}
              width={200}
              textAnchor='middle'
            >MSRE</text>

            <XAxis dataKey="x" />
            <CartesianGrid stroke="#f5f5f5" />
            <Line type="monotone" dataKey="y" stroke="#ff0000ff" />
          </LineChart>
        </ResponsiveContainer>


      </div>
    </div>

  );
}
