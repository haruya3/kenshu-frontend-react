import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
;import Input from '@mui/joy/Input';
import Container from '@mui/joy/Container';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import { useCallback, useState } from 'react';
import Typography from '@mui/joy/Typography';
import { Task, UpdateTask200, UpdateTaskBody, getListTasksQueryKey, useCreateTask, useListTasks, useUpdateTask } from './generated';
import { useQueryClient, UseMutationResult } from 'react-query';
import { IconButton, Modal } from '@mui/material';
import type { AxiosError, AxiosResponse} from 'axios'

const MainStyle = {
   display: 'grid',
   alignItems: 'center', 
   width: '100%', 
   minWidth: '700px', 
   height: 'auto', 
   minHeight: '700px'
}

const ModalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'grid',
  justifyContent: 'center',
  alignItems: 'ceneter',
  width: '100%',
  height: 'auto',
}

const EditBoxStyle = {
  display: 'grid',
  alignItems: 'center',
  width: '800px',
  outline: '0px'
}

const ContainerStyle = {
  display: 'grid',
  gridTemplateRows: '0.6fr 1.4fr',
  alignItems: 'center',
  rowGap: '20px',
}

const InputStyle = {
  display: 'grid', 
  justifyContent: 'center'
}


const BoxTasksStyle = {
  display: 'grid',
  rowGap: '3px',
}

const BoxTaskStyle = {
  display: 'grid',
  gridTemplateColumns: '0.1fr 1.6fr',
  justifyContent: 'ceneter',
  alignItems: 'center'
}

export const App = () => {
  const [title, setTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateTask, setUpdateTask] = useState<Task | {}>({});
   
  const onChangeTitle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value), [title]);
  const { data, status } = useListTasks();

  const client = useQueryClient();
  const createTaskMutation = useCreateTask({
    mutation: {
      onSuccess: (result) => {
        //useCreateTaskの中でpostが完了してからmutationが行われるので同期関数であるsetQueryData使える
        client.setQueryData(getListTasksQueryKey(), (prevState: any) => {
          const prevTaskList = prevState.data.tasks;
          const nextState = {
            ...prevState,
            data: { tasks: [...prevTaskList, result.data.task] },
          };

          return nextState;
        });
      },
    },
  });

  const updateTaskMutation = useUpdateTask({
    mutation: {
      onSuccess: (result) =>
        client.setQueryData(getListTasksQueryKey(), (prevState: any) => {
          const newTasks = prevState.data.tasks.map((task: Task) =>
            task.id === result.data.task.id ? result.data.task : task
          );
          return {
            ...prevState,
            data: { tasks: newTasks },
          };
        }),
    },
  });

  const onClickCreateTaskButton = useCallback(() => {
    createTaskMutation.mutate();
    setTitle('');
  }, [])

  const handleOpenModal = (data: Task) => {
    setUpdateTask(data);
    setIsModalOpen(true);
  }

  const onClickCheckButton = (task: Task) => {
    const finishedAt = new Date().toISOString();
    updateTaskMutation.mutate({
      taskId: task.id, 
      data: {
        ...task,
        finishedAt,
      }
    });
  }

  return (
    <main style={MainStyle}>
        <EditorModal 
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          updateTaskMutation={updateTaskMutation}
          data={updateTask as Task}
        />
      <Container style={ContainerStyle}>
        <Box>
          <Input
            onChange={onChangeTitle}
            value={title}
            startDecorator={<FormatListBulletedRoundedIcon />}
            endDecorator={<Button onClick={onClickCreateTaskButton} disabled={title.length > 0 ? false : true} >作成</Button>}
          />
        </Box>
        <Box style={BoxTasksStyle}>
          {
            status === 'loading' && <Typography color='primary' style={{ textAlign: 'center'}}>ロード中...</Typography>
          }
          {
            status === 'success' && data.data.tasks.map((data: Task) => 
            <Box key={data.id} style={BoxTaskStyle}>
              <IconButton style={{color: data.finishedAt === null ? '#64748B' : 'green'}} onClick={() => onClickCheckButton(data)}> <CheckCircleOutlineIcon /> </IconButton>
              <Input value={data.title} readOnly onClick={() => handleOpenModal(data)} style={InputStyle}/>
            </Box>
          )}
          {
            status === 'error' && <Typography style={{ textAlign: 'center'}} color='danger'>エラーです。</Typography>
          }
        </Box>
      </Container>
    </main>
  );
};

type EditModalProps = {
  isModalOpen: boolean,
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>,
  updateTaskMutation: UseMutationResult<AxiosResponse<UpdateTask200, any>, AxiosError<unknown, any>, {
    taskId: string;
    data: UpdateTaskBody;
  }, unknown>
  data: Task
}

const EditorModal = (props: EditModalProps) => {
  const { isModalOpen, setIsModalOpen, updateTaskMutation, data } = props
  const [title, setTitle] = useState('');

  const handleCloseModal = () => {
    setTitle('');
    setIsModalOpen(false);
  }

  const onChangeTitle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => setTitle(event.target.value), []);

  const updateTask = () => {
    data.title = title;
    updateTaskMutation.mutate({
      taskId: data.id, 
      data: data
    });
    setIsModalOpen(false);
  };

  return (
    <Modal
      style={ModalStyle}
      open={isModalOpen}
      onClose={handleCloseModal}
    >
    <Box style={EditBoxStyle}>
      <Input 
        value={title}
        onChange={onChangeTitle}
        endDecorator={<Button onClick={updateTask}>完了</Button>}
      />
    </Box>
  </Modal>
  )
}