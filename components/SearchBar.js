import React, { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';

const SearchBar = ({ value, onChangeText = () => {} }) => {
  const [text, setText] = useState(value);

  const handleChangeText = (newText) => {
    setText(newText);
    onChangeText(newText);
  };

  return (
    <TextInput
      style={styles.searchInput}
      placeholder="Search"
      value={text}
      onChangeText={handleChangeText}
    />
  );
};

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

export default SearchBar;
