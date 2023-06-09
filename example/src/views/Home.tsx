import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import RNCloudStorage, {
  CloudStorageError,
  CloudStorageErrorCode,
  CloudStorageFileStat,
  CloudStorageScope,
  useIsCloudAvailable,
} from 'react-native-cloud-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';

const HomeView = () => {
  const [scope, setScope] = useState(CloudStorageScope.Documents);
  const [parentDirectory, setParentDirectory] = useState('');
  const [filename, setFilename] = useState('test.txt');
  const [stats, setStats] = useState<CloudStorageFileStat | null>(null);
  const [input, setInput] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const cloudAvailable = useIsCloudAvailable();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log(cloudAvailable ? 'Cloud storage available' : 'Cloud storage not available');
  }, [cloudAvailable]);

  useEffect(() => {
    const subscription = RNCloudStorage.subscribeToFilesWithSameName(({ path, fileIds }) =>
      console.warn('Multiple files with same name', { path, fileIds })
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    RNCloudStorage.setGoogleDriveAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    setStats(null);
    setInput('');
  }, [parentDirectory, filename, scope]);

  const handleCheckDirectoryExists = async () => {
    setLoading(true);
    try {
      const exists = await RNCloudStorage.exists(parentDirectory, scope);
      Alert.alert(
        parentDirectory.length ? `Directory ${parentDirectory} exists?` : 'Root Directory exists?',
        exists ? '✅ Yes' : '❌ No'
      );
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    setLoading(true);
    try {
      await RNCloudStorage.mkdir(parentDirectory, scope).catch(() => setLoading(false));
      readFile();
    } catch (e) {
      console.warn(e);
    }
  };

  const readFile = async () => {
    setLoading(true);
    try {
      const newStats = await RNCloudStorage.stat(parentDirectory + '/' + filename, scope);
      setStats(newStats);
      console.log('File stats', stats);
      if (newStats.isDirectory()) return;
      setInput(await RNCloudStorage.readFile(parentDirectory + '/' + filename, scope));
    } catch (e) {
      if (e instanceof CloudStorageError) {
        if (e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          setStats(null);
          setInput('');
        } else {
          console.warn('Native storage error', e.code, e.message);
        }
      } else console.warn('Unknown error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async () => {
    setLoading(true);
    try {
      await RNCloudStorage.writeFile(parentDirectory + '/' + filename, input, scope).catch(() => setLoading(false));
      readFile();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRead = readFile;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await RNCloudStorage.unlink(parentDirectory + '/' + filename, scope).catch(() => setLoading(false));
      readFile();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      <Text style={styles.title}>RNCloudStorage{'\n'}Example App</Text>
      <Text style={styles.subtitle}>Cloud storage available: {cloudAvailable ? '✅ Yes' : '❌ No'}</Text>
      <Card title="Working Directory">
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Directory Scope</Text>:{' '}
          {scope === CloudStorageScope.Documents ? 'Documents' : 'App Data'}
        </Text>
        <Button
          title={`Switch to ${scope === CloudStorageScope.Documents ? 'App Data' : 'Documents'} scope`}
          onPress={() =>
            setScope(scope === CloudStorageScope.Documents ? CloudStorageScope.AppData : CloudStorageScope.Documents)
          }
        />
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Parent directory</Text>
        <TextInput
          placeholder="Parent directory (root if empty)"
          value={parentDirectory}
          onChangeText={setParentDirectory}
          style={styles.input}
        />
        <Button title="Check if exists" onPress={handleCheckDirectoryExists} />
        <Button title="Create this directory" onPress={handleCreateDirectory} />
        <Text style={styles.smallText}>Before performing any file operations, the parent directory must exist.</Text>
      </Card>
      <Card title="File Operations">
        <Text style={{ fontWeight: 'bold' }}>Filename of working file</Text>
        <TextInput placeholder="Filename" value={filename} onChangeText={setFilename} style={styles.input} />
        <Button title="Read file" onPress={handleRead} />
        <Button title="Delete file" onPress={handleDelete} />
        <TextInput
          placeholder="File contents (read/write)"
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <Button title="Write to file" onPress={handleCreateFile} />
        <Text style={styles.smallText}>
          The filename will be prefixed with the parent directory. If the file does not exist, it will be created. If it
          does exist, it will be overwritten.
        </Text>
        <Text style={{ alignSelf: 'flex-end' }}>
          <Text style={{ fontWeight: 'bold' }}>Test file exists</Text>:{' '}
          {stats ? (stats.isDirectory() ? '❌ No (is directory)' : '✅ Yes') : '❌ No'}
        </Text>
      </Card>
      {Platform.OS !== 'ios' && (
        <Card title="Google Drive">
          <Text style={{ fontWeight: 'bold' }}>Access Token</Text>
          <TextInput
            placeholder="Google Drive access token"
            value={accessToken}
            onChangeText={setAccessToken}
            style={styles.input}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  scrollView: {
    backgroundColor: '#F5FCFF',
  },
  container: {
    backgroundColor: '#F5FCFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});

export default HomeView;
