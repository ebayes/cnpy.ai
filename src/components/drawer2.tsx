import React from 'react'
import { Text, Badge, Group } from '@mantine/core';


function DrawerContentGeneral() {
  return (
    <div>
        <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Name:</Text>
            <Text fz="sm" variant="light" style={{ marginLeft: '10px' }}>
              Classification {/* model name - {selectedModel} */}
            </Text>
          </Group>
          <Group position="apart" mt="md" mb="xs">
            <Text fz="sm" fw={500}>Model:</Text>
            <Badge color="pink" variant="light" style={{ marginLeft: '10px' }}>
              MobileNet {/* underlying model */}
            </Badge>
          </Group>
          <Group>
          <Text fz="sm" fw={500}>
            Classes:
          </Text>
          <Badge 
            radius="xl"
            size="xs"
            compact
            className={`bg-gray-500 text-white hover:bg-gray-500`}
          >
            Tiger etc
          </Badge>
            {/* add badges by iterating through classFiles[]
                    <Badge 
                      id={`badgeclass-${clsName}`} 
                      key={clsName} 
                      radius="xl" 
                      size="xs"
                      compact
                      className={`bg-gray-500 text-white hover:bg-gray-500`}
                    >
                  {clsName}
                </Badge>
              );
            })}

      */}
          </Group>
    </div>
  )
}

export default DrawerContentGeneral