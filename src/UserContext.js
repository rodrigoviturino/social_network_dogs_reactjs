import React from 'react';
import { TOKEN_POST, TOKEN_VALIDATE_POST, USER_GET } from './api';
import { useNavigate } from 'react-router';

export const UserContext = React.createContext();

export const UserStorage = ({children}) => {
  const [data, setData] = React.useState(null);
  const [login, setLogin] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const navigate = useNavigate();

  async function getUser(token){
    const { url, options } = USER_GET(token);
    const response = await fetch(url, options);
    const json = await response.json();
    console.log(json);
    setData(json);
    setLogin(true);
  }  

  async function userLogin(username, password){
    try{
      setError(null);
      setLoading(true);

      const { url, options } = TOKEN_POST({username, password});
      const tokenResponse = await fetch(url, options);
      if(!tokenResponse.ok) throw new Error(`Error: ${tokenResponse.statusText}`);
      const {token} = await tokenResponse.json();
      window.localStorage.setItem('token', token);
      await getUser(token);
      navigate('/conta');
    } catch(err){
      setError(err.message)
      setLogin(false);
    } finally {
      setLoading(false);
    }
  }

  const userLogout = React.useCallback( async function () {
    setData(null);
    setError(null);
    setLoading(false);
    setLogin(false);
    window.localStorage.removeItem('token');
    navigate('/login')
  })

  // Por ser função que executa uma vez, temos que criar as funções antes de usar no useEffect
  React.useEffect(() => {

    async function autoLogin(){
      const token = window.localStorage.getItem('token');
      if(token){
        try{
          setError(null);
          setLoading(true);
          const {url, options} = TOKEN_VALIDATE_POST(token);
          const response = await fetch(url, options);
            if(!response.ok) throw new Error('Token Inválido');
            const json = await response.json();
            await getUser(token);

        } catch(err){
          userLogout();
        } finally {
          setLoading(false);
        }
      }
    }

    autoLogin();
  }, [userLogout])

  return (
    <UserContext.Provider value={{ userLogin, userLogout, data, error, loading, login }}>
      {children}
    </UserContext.Provider>
  )
}
