import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, VirtualizedList, FlatList, Image, StyleSheet, TouchableOpacity, TouchableHighlight , ScrollView, Modal, RefreshControl  } from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';
import axios from 'axios';
import { NavigationContainer, useNavigation  } from '@react-navigation/native';
import { createStackNavigator} from '@react-navigation/stack';
import 'react-native-gesture-handler';
const Stack = createStackNavigator();



function NavBar(){
  const navigation = useNavigation();
  // Komponen Navbar
  return(
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View id='navbar' style={styles.nav}> 
          <Image style={styles.logo} source={require('./assets/Watch-new-nobg.png')} />
          <TouchableOpacity style={[styles.menu, styles.navmenu]} onPress={() => navigation.navigate('home')}>
            <Text style={styles.menutext}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menu} onPress={() => navigation.navigate('myMovies')}>
            <Text style={styles.menutext}>My Movies</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}


const Routing = () => {
  // Komponen-komponen
  return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
          name="home" 
          component={HomePage}
          options={{ 
            headerTitle: (props) => <NavBar {...props}/>,
            headerLeft: null,
          }}
          />
          <Stack.Screen 
            name="myMovies" 
            component={MyMoviesPage}
            options={{ 
              headerTitle: (props) => <NavBar {...props}/>,
              headerLeft: null,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
  );
};

// Home Page
const HomePage = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [movieList, setMovieList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMovies, setSearchMovies] = useState([]);
  const [foundSearch, setFoundSearch] = useState('-1');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [addedWish, setAddedWish] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const url = 'http://110.239.71.90:5678';

  // Fungsi-fungsi
  //Now Playing
    useEffect(() => {
      axios.get(`${url}/now_playing`, {
      })
      .then((result) => {
        console.log("Data nowPlaying Movie: ", result.data);
        setMovies(result.data);
      })
      .catch(error => console.error("Error fetching data playing now: ", error));
    }, []);

    //Trending
    useEffect(() => {
      axios.get(`${url}/trending`, {
      })
      .then((result) => {
        console.log("Data Trending Movies: ", result.data);
        setTrendingMovies(result.data);
      })
      .catch(error => console.error("Error fetching data trending: ", error));
    }, []);

    //search
    const handleSearch = () => {
        axios.post(`${url}/search`, {
            query: searchQuery, 
        })
        .then(res => {
          console.log("Search movies: ", res.data.results);
          console.log("Total results: ", res.data.total_results);
          setSearchMovies(res.data.results);
          setFoundSearch(res.data.total_results);
        })
        .catch(err => console.error("Error fetching data search: ", err));
    };

    const cardhandle = (movieId) => {
      axios.post(`${url}/detail/movie`, {
          query : movieId,
        })
        .then(res => {
          console.log("Detail movie: ", res.data);
          setSelectedMovie(res.data);
          setIsModalVisible(true);
        })
        .catch(err => console.error("Error fetching data detail: ", err));
    };
    
    useEffect(() => {
    axios.get(`${url}/get/list`)
      .then(res => {
        setMovieList(res.data.results);
        for(let index of res.data.results){
          setAddedWish(prev => [...prev, index.movieId]);
        }
        console.log("Data dari mysql: ", res.data.results);
      })
      .catch(err => console.error("Error fetching data: ", err));
  }, []);

    const saveMovie = async (movieId ,poster_path, title) => {
      await axios.post(`${url}/add/list`,{
          movie_id : movieId,
          poster_path: poster_path,
          title: title,
      })
        .then(res => {
          setAddedWish(prev => [...prev, movieId])
          console.log("Response Pengiriman Data: ", res);
        })
        .catch(err => console.error("Gagal mengirim data: ", err));
    };

    const removeMovie = (movieId) => {
      try{
        const res = axios.post(`${url}/remove/list`,{
          query: movieId,
        })
        .then(res => {
          console.log("Data Sended", 200);
          setAddedWish(prev => prev.filter(id => id !== movieId));
        })
      } catch (error) {
        console.error("Failed Sending Data", 400)
      }
    };

    // Komponen-komponen
    return (
      <SafeAreaProvider style={styles.sap}>
        <SafeAreaView style={styles.container}>
        <View style={styles.searchbar}>
            <TextInput style={styles.input} 
            placeholder='Search Movies'
            value={searchQuery}
            onChangeText={ val => setSearchQuery(val)} 
            />
            <TouchableOpacity style={styles.searchbtn} onPress={handleSearch}>
              <Text style={styles.searchtext}>Search</Text>
            </TouchableOpacity>
        </View>
        {searchQuery != '' ? (
          //jika isi query 
          <>
          <ScrollView contentContainerStyle={[styles.container, styles.scrollview]} showsVerticalScrollIndicator={false}>
          <View style={styles.search}>
            <Text style={styles.searchResText}>
              Search Result::
              <Text style={styles.searchTextRes} numberOfLines={2}> {searchQuery}</Text>
            </Text>
            {foundSearch != 0 ? (
              <>
              <VirtualizedList
              style={styles.flatposters}
              data={searchMovies}
              initialNumToRender={10}
              renderItem={({ item }) => (
                <View style={styles.movieItem}>
                  <TouchableOpacity style={styles.posterntext} onPress={() => cardhandle(item.id)}>
                  {item.backdrop_path != null ? (
                    <Image
                      style={styles.poster}
                      source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    />
                  ): (
                    <Image
                      style={styles.poster}
                      source={require('./assets/notfound-nobg.png')}
                    />
                  )}
                    <Text style={styles.movieTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                  </TouchableOpacity>
                </View>
                )}
                keyExtractor={(item) => item.id.toString()}
                getItemCount={(data) => data.length}
                getItem={(data, index) => data[index]}
              />
              </>
            ) : (
              <Text style={styles.notFoundText}>No Result Founds!</Text>
            )}
          </View>
          </ScrollView>

          </>
        ) : (
          <ScrollView contentContainerStyle={[styles.container, styles.scrollview]} showsVerticalScrollIndicator={false}>
          <View style={styles.trending}>
            <Text style={styles.headText}>Trending</Text>
            <FlatList style={styles.flatposters}
            horizontal
            data={trendingMovies}
            renderItem={({ item }) => (
              <View style={styles.movieItem}>
              <TouchableOpacity style={styles.posterntext} onPress={() => cardhandle(item.id)}>
                <Image
                  style={styles.poster}
                  source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                />
                <Text style={styles.movieTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
              </TouchableOpacity>
              </View>
            )}
          keyExtractor={item => item.id.toString()}
          />
          </View>
          <View style={styles.movie}>
            <Text style={styles.headText}>Movies</Text>
            <VirtualizedList
              style={styles.flatposters}
              data={movies}
              initialNumToRender={10}
              renderItem={({ item }) => (
                <View style={styles.movieItem}>
                  <TouchableOpacity style={styles.posterntext} onPress={() => cardhandle(item.id)}>
                    <Image
                      style={styles.poster}
                      source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    />
                    <Text style={styles.movieTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              getItemCount={(data) => data.length}
              getItem={(data, index) => data[index]}
            />
          </View>
          </ScrollView>
        )}
        {selectedMovie && (
          <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                      <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                          <Text style={styles.closeButtonText}>X</Text>
                      </TouchableOpacity>
                      {!addedWish.includes(selectedMovie.id) ? (
                        <TouchableHighlight style={styles.wishBtn} activeOpacity={0.6}
  underlayColor="#DDDDDD" onPress={() => saveMovie(selectedMovie.id, selectedMovie.poster_path, selectedMovie.title) }>
                          <Text style={styles.addText}>Add To Watchlist!</Text>
                        </TouchableHighlight>
                      ) : (
                        <TouchableHighlight style={styles.wishBtn} activeOpacity={0.6}
  underlayColor="#DDDDDD" onPress={() => removeMovie(selectedMovie.id)}>
                          <Text style={styles.addedText}>Movie Already Added!</Text>
                        </TouchableHighlight>
                      )}
                      {selectedMovie.poster_path ? (
                        <Image style={styles.posterImage} source={{ uri: `https://image.tmdb.org/t/p/w500/${selectedMovie.poster_path}` }} />
                      ) : (
                        <Image style={styles.posterImage} source={require('./assets/notfound-nobg.png')} />
                      )}
                      <Text style={styles.title}>{selectedMovie.title}</Text>
                      <Text style={styles.overview}>{selectedMovie.overview}</Text>
                      <Text style={styles.info}>
                          Genre: {selectedMovie.genres.map((genre) => genre.name).join(', ')}
                      </Text>
                      <Text style={styles.info}>Rating: {selectedMovie.vote_average}</Text>
                      <Text style={styles.info}>Status: {selectedMovie.status}</Text>
                      <Text style={styles.info}>Release Date: {selectedMovie.release_date}</Text>
                      <Text style={styles.info}>
                          Country: {selectedMovie.production_countries.map((country) => country.name).join(', ')}
                      </Text>
                  </View>
              </View>
          </Modal>
        )}
        </SafeAreaView>
      </SafeAreaProvider>
    ) 
};

// My Movies Page
// Fungsi-fungsi
const MyMoviesPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [addedWish, setAddedWish] = useState([]);
  const [movieList, setMovieList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const url = 'http://110.239.71.90:5678';


  // Fungsi-fungsi

    const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      getMovie();
      setRefreshing(false);
    }, 2000);
  };

    const cardhandle = (movieId) => {
      axios.post(`${url}/detail/movie`, {
          query : movieId,
        })
        .then(res => {
          console.log("Detail movie: ", res.data);
          setSelectedMovie(res.data);
          setIsModalVisible(true);
        })
        .catch(err => console.error("Error fetching data detail: ", err));
    };

    const saveMovie = (movieId, poster_path, title) => {
      axios.post(`${url}/add/list`,{
          movie_id : movieId,
          poster_path: poster_path,
          title: title,
      })
        .then(res => {
          console.log("Response Pengiriman Data: ", res);
          setAddedWish(prev => [...prev, movieId]);
        })
        .catch(err => console.error("Gagal mengirim data: ", err));
    };

    const removeMovie = (movieId) => {
      try{
        const res = axios.post(`${url}/remove/list`,{
          query: movieId,
        })
        .then(res => {
          console.log("Data Sended", 200);
          setAddedWish(prev => prev.filter(id => id !== movieId));
        })
      } catch (error) {
        console.error("Failed Sending Data", 400)
      }
    };

    // Panggil Get List
    const getMovie = () => {
    axios.get(`${url}/get/list`)
      .then(res => {
        setMovieList(res.data.results);
        console.log("Data dari mysql: ", res.data.results);
        for(let index of res.data.results){
          setAddedWish(prev => [...prev, index.movieId]);
        }
      })
      .catch(err => console.error("Error fetching data: ", err));
  }; 

    useEffect(() => {
      getMovie();
    }, []);

    const beenWatch = (movieId) => {
      axios.put(`${url}/edit/list/${movieId}`,{
        movieId: movieId,
        is_watch: 1,
      })
        .then(res => {
          console.log("Response Update Data: ", res.data);
        })
        .catch(err => console.error("Gagal update data: ", err));
    };

    const undoBeenWatch = (movieId) => {
      axios.put(`${url}/edit/list/${movieId}`,{
        movieId: movieId,
        is_watch: 0,
      })
        .then(res => {
          console.log("Response Update Data: ", res.data);
        })
        .catch(err => console.error("Gagal update data: ", err));
    };

    const isbeenWatch = ( selectedMovieId ) => {
      const foundMovie = movieList.find(movie => movie.movieId == selectedMovieId);

      if(foundMovie.is_watch == 0){
        return 0;
      }else{
        return 1;
      }
      };
  
  // Komponen-komponen
  return(
    <SafeAreaProvider style={styles.sap}>
      <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.headTextUrMovie}>Your Movie List</Text>
      { movieList.length == 0 ? (
        <View style={styles.notFoundMovies}>
          <Image style={styles.notFoundMoviesImg} source={require('./assets/movies-notfoundNew.png')}/>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.container, styles.scrollview]} showsVerticalScrollIndicator={false} refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
          <View style={styles.movie}>
            <VirtualizedList
              style={styles.flatposters}
              data={movieList}
              initialNumToRender={10}
              renderItem={({ item }) => (
                <View style={styles.movieItem}>
                  <TouchableOpacity style={styles.posterntext} onPress={() => cardhandle(item.movieId)}>
                  {item.poster_path ? (
                    <Image
                      style={styles.poster}
                      source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                    />
                  ) : (
                    <Image
                      style={styles.poster}
                      source={require('./assets/notfound-nobg.png')}
                    />
                  )}
                    <Text style={styles.movieTitle} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
                  </TouchableOpacity>
                </View>
              )}
              keyExtractor={(item) => item.movieId.toString()}
              getItemCount={(data) => data.length}
              getItem={(data, index) => data[index]}
            />
          </View>
          </ScrollView>
      )}


      </View>
      {selectedMovie && (
          <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
              <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                      <TouchableOpacity style={styles.closeButton} onPress={() => {
                        setIsModalVisible(false);
                        getMovie();
                        }}>
                          <Text style={styles.closeButtonText}>X</Text>
                      </TouchableOpacity>
                      { isbeenWatch(selectedMovie.id) == 0 ? (
                        <TouchableHighlight style={styles.isWatchimgView} activeOpacity={0.6}
  underlayColor="rgba(221, 221, 221, 0.1)" onPress={() => {
                      beenWatch(selectedMovie.id);
                      getMovie();
                      cardhandle(selectedMovie.id);
                      }}>
                          <Image style={styles.isWatchimg} source={require('./assets/NeverBeenWatch.png')}/>
                        </TouchableHighlight>
                      ) : (
                        <TouchableHighlight style={styles.isWatchimgView} activeOpacity={0.6}
  underlayColor="rgba(221, 221, 221, 0.1)" onPress={() => {
                      undoBeenWatch(selectedMovie.id);
                      getMovie();
                      cardhandle(selectedMovie.id);
                      }}>
                          <Image style={styles.isWatchimg} source={require('./assets/alreadyWatch.png')}/>
                        </TouchableHighlight>
                      )}

                      {!addedWish.includes(selectedMovie.id) ? (
                        <TouchableHighlight style={styles.wishBtn} activeOpacity={0.6}
  underlayColor="#DDDDDD" onPress={() => saveMovie(selectedMovie.id, selectedMovie.poster_path, selectedMovie.title)}>
                          <Text style={styles.addText}>Add To Watchlist!</Text>
                        </TouchableHighlight>
                      ) : (
                        <TouchableHighlight style={styles.wishBtn} activeOpacity={0.6}
  underlayColor="#DDDDDD" onPress={() => removeMovie(selectedMovie.id)}>
                          <Text style={styles.addedText}>Movie Already Added!</Text>
                        </TouchableHighlight>
                      )}
                      {selectedMovie.poster_path ? (
                        <Image style={styles.posterImage} source={{ uri: `https://image.tmdb.org/t/p/w500/${selectedMovie.poster_path}` }} />
                      ) : (
                        <Image style={styles.posterImage} source={require('./assets/notfound-nobg.png')} />
                      )}
                      <Text style={styles.title}>{selectedMovie.title}</Text>
                      <Text style={styles.overview}>{selectedMovie.overview}</Text>
                      <Text style={styles.info}>
                          Genre: {selectedMovie.genres.map((genre) => genre.name).join(', ')}
                      </Text>
                      <Text style={styles.info}>Rating: {selectedMovie.vote_average}</Text>
                      <Text style={styles.info}>Status: {selectedMovie.status}</Text>
                      <Text style={styles.info}>Release Date: {selectedMovie.release_date}</Text>
                      <Text style={styles.info}>
                          Country: {selectedMovie.production_countries.map((country) => country.name).join(', ')}
                      </Text>
                  </View>
              </View>
          </Modal>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};


export default Routing;

//styling
const styles = StyleSheet.create({
  container: { 
      flexDirection: 'column', 
      padding: 10,
      marginHorizontal: -10,
      backgroundColor: '#fcfdff',
      },
    sap: {
      backgroundColor: '#fcfdff',
    },
    scrollview: {
      paddingHorizontal: -20,
      paddingBottom: 70,
    },
    logo: {
      height: 65,
      width: 120,
      marginRight: 40,
      flexDirection: 'row',
      padding: 10,
    },
    nav: {
      flexDirection: 'row',
      marginTop: -15,
      marginHorizontal: -10,
      padding: 2,
      alignItems: 'center',
      borderBottomColor: '#0c0c0c',
      borderBottomWidth: 3,
    },
    input: {
    padding: 5,
    borderColor: '#000',
    width: 200,
    height: 40,
    marginHorizontal: 10,
    marginVertical: 10,
    borderBottomWidth: 2,
    borderRadius: 2,
    flex: 1,
  },
  menu: {
    padding: 10,
    borderRadius: 10,
    marginRight: 50,
    alignItems: 'flex-end',
  },
  navmenu: {
    marginLeft: 1100,
  },
  menutext: {
    fontWeight: 'bold',
    fontSize: 16,
    fontStyle: 'arial',
  },
  searchbtn: {
    backgroundColor: '#00B8A3',
    width: 120, 
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderColor: '#fff', 
    marginRight: 10,
  },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -2,
    marginBottom:20,
  },
  searchtext: {
    color: '#f5fffe',
    fontWeight: 'bold',
  },
  headText: {
    fontSize: 26,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor:'#151d1f',
    marginLeft: 5,
    marginRight: 10,
  },
  headTextUrMovie: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 10,
    marginLeft: 8,
    borderBottomWidth:2,
    borderBottomColor: '#000',
    marginRight: 10,
  },
  searchResText: {
    fontSize: 26,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor:'#151d1f',
    marginLeft: 5,
    marginRight: 20,
  },
  searchTextRes: {
    fontSize: 20,
    fontWeight: 600,
    fontStyle: 'italic',
  },
  notFoundText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 700,
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 36, 36, 0.7)',
    padding: 10,
    borderRadius:50,
    marginTop: 100,
    marginHorizontal: 50,
    alignContent: 'center',
    textAlign: 'center',
  },
  flatposters: {
    marginHorizontal: -10,
    alignItems: 'center',
  },
  movieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  trending: {
    backgroundColor: 'rgba(177, 250, 242, 0.18)',
  },
  movie: {
    marginHorizontal: 1,
  },
  search: {
    marginHorizontal: 1,
  },
  poster: {
    width: 320,
    height: 360,
    borderColor: 'rgba(38, 26, 46, 0.8)',
    borderWidth: 3,
    borderRadius: 4,
  },
  movieTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    width:320,
  },
  posterntext: {
    marginHorizontal: 15,
    padding:10,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContent: { 
    width: '80%', 
    backgroundColor: '#f7f8fa', 
    borderRadius: 10, 
    padding: 16 
  },
  closeButton: { 
    position: 'absolute', 
    top: -25, 
    right: -25,
    backgroundColor: 'rgba(255, 66, 82, 0.89)',
    width: 38,
    alignItems: 'center',
    borderRadius: 100, 
    padding: 5, 
  },
  closeButtonText: { 
    fontSize: 20, 
    color: '#57010f', 
  },
  posterImage: { 
    width: '100%', 
    height: 300, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(38, 26, 46, 0.8)',
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  overview: { 
    marginVertical: 10, 
    fontSize: 16, 
  },
  info: {
    fontSize: 14,
    marginBottom: 2,
  },
  wishBtn: {
    position: 'absolute', 
    right: 22,
    top: 286,
    borderRadius: 40,
    zIndex: 10,
  },
  addText: {
    fontSize: 10,
    padding: 5,
    borderRadius: 40,
    backgroundColor: '#e6edfa',
    color: '#006cbf',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#a2b7e0'
  },
  addedText: {
    fontSize: 10,
    padding: 6,
    borderRadius: 40,
    backgroundColor: '#faefe6', 
    color: '#940f24',
    fontWeight: 'bold',
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: '#e0bea2'
  },
  notFoundMovies: {
    marginHorizontal: 5,
    top: 75,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundMoviesImg:{
    width: 480, 
    height: 360,
  },
  isWatchimgView: {
    position: 'absolute', 
    left: 20,
    borderRadius: 20,
    top: 20,
    zIndex: 10,
  },
  isWatchimg: {
    width: 52, 
    height: 52,
  },
});