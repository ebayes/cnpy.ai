// drawer2.tsx

import React from 'react'
import { Text, Badge, Group, Rating, MultiSelect } from '@mantine/core';


function DrawerContentGeneral() {
  const animals = ['Tiger', 'Leopard', 'Wild dog', 'Black bear', 'Red Panda', 'Buffalo', 'Wild pig', 'Marten', 'Goat', 'Deer'];
  return (
    <div>
        <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Name:</Text>
            <Text fz="sm" variant="light" style={{ marginLeft: '10px' }}>
              India/Bhutan {/* model name - {selectedModel} */}
            </Text>
          </Group>
          
          <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Model:</Text>
            <Badge color="pink" variant="light" style={{ marginLeft: '10px' }}>
              MobileNet {/* underlying model */}
            </Badge>
          </Group>
          {/*  <Group  position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Power:</Text>
            <input
              disabled
              type="range"
              id="power"
              // ref={powerRef}
              name="power"
              min="1"
              max="4"
              defaultValue="4"
              step="1"
              className="slider w-2/5 ml-2"
              title="How many CPU cores to use for processing"
              // disabled={status.busy}
            />
          </Group> */}
          <Group position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Speed:</Text>
            <Rating value={4} readOnly />
          </Group> 
          <Group position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Accuracy:</Text>
            <Rating value={4.5} fractions={2} readOnly />
          </Group> 
          <Group position="apart" mt="md" mb="xs" className="flex items-start">
            <Text fz="sm" fw={500}>
              Classes:
            </Text>
          
            <div className='w-72'>
              <MultiSelect
                data={animals}
                defaultValue={['Tiger', 'Leopard', 'Wild dog', 'Black bear', 'Red Panda', 'Buffalo', 'Wild pig', 'Marten', 'Goat', 'Deer']}
                readOnly
              />
            </div>
          </Group>
          <div className='pt-3 flex justify-between items-start'>
          <Text fz="sm" fw={500}>Description:</Text>
          <div className='w-72'>
            <Text fz="sm" ta="right" variant="light">
              Classes are filtered from<a
                href="https://deeplearning.cms.waikato.ac.nz/user-guide/class-maps/IMAGENET/"
                target="_blank"
                className="hover:text-blue-500 underline"
              >
                MobileNet
              </a> classes. Warning: some may repeat.
            </Text>
          </div>
        </div>
    </div>
  )
}

export default DrawerContentGeneral