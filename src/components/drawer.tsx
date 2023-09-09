import React from 'react'
import { Text, Badge, Group } from '@mantine/core';


function DrawerContent() {
  return (
    <div>
        <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Name:</Text>
            <Text fz="sm" variant="light" style={{ marginLeft: '10px' }}>
              Custom
            </Text>
          </Group>
          <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Model:</Text>
            <Badge color="pink" variant="light" style={{ marginLeft: '10px' }}>
              OpenAI Clip
            </Badge>
          </Group>
          
          <Group  position="apart" mt="md" mb="xs" className="flex items-center">
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
          </Group>
          <Group position="apart" mt="md" mb="xs" className="flex items-center">
            <Text fz="sm" fw={500}>Speed:</Text>
            <Badge color="blue" variant="light" style={{ marginLeft: '10px' }}>
            5.8 Images/Second
            </Badge>
          </Group> 
          <Text fz="sm" fw={500}>Classes:</Text>
    </div>
  )
}

export default DrawerContent