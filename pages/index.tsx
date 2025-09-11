import { GetServerSideProps } from 'next';

export default function Index() {
  return <div>Redirecionando...</div>;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/login',
      permanent: false,
    },
  };
};