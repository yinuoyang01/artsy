import * as React from "react"
import * as Relay from "react-relay"

import { MetadataText, SmallHeadline } from "../Components/Inbox/Typography"

import {
  FlatList,
  ImageURISource,
  KeyboardAvoidingView,
  NativeModules,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  ViewProperties,
} from "react-native"

import styled from "styled-components/native"
import colors from "../../data/colors"
import fonts from "../../data/fonts"

import BottomAlignedButton from "../Components/Consignments/Components/BottomAlignedButton"

import ArtworkPreview from "../Components/Inbox/Conversations/Previews/ArtworkPreview"
import ARSwitchBoard from "../NativeModules/SwitchBoard"
import { gravityURL } from "../relay/config"
import { NetworkError } from "../system/errors"

const Container = styled.View`
  flex: 1
  flex-direction: column
`
const Header = styled.View`
  alignSelf: stretch
  margin-top: 10
  flex-direction: column
  margin-bottom: 30
`
// This is really rubbish, but I basically have to create an equally sized element
// on the top right, to get the title in the middle
const PlaceholderView = styled(SmallHeadline)`
  padding-right: 20
  color: white
`
const TitleView = styled.View`
  align-self: center
  align-items: center
  margin-top: 6
`
const HeaderTextContainer = styled.View`
  flex-direction: row
  justify-content: space-between
`
const CancelButton = styled.TouchableOpacity`padding-left: 20;`
const Content = styled.View`
  margin-left: 20
  margin-right: 20
`
const InquiryTextInput = styled.TextInput`
  font-size: 16
  margin-top:20
  font-family: ${fonts["garamond-regular"]}
`
const ResponseRate = styled(SmallHeadline)`
  color: ${colors["yellow-bold"]}
  marginTop: 5
`
const ResponseIndicator = styled.View`
  width: 8
  height: 8
  border-radius: 4
  margin-top: 5
  margin-right: 5
  background-color: ${colors["yellow-bold"]}
`
const ResponseRateLine = styled.View`
  flex: 1
  flex-direction: row
  align-items: center
  min-height: 12
  margin-top: 5
`

export class Inquiry extends React.Component<RelayProps, any> {
  constructor(props) {
    super(props)
    console.log(props)
    this.state = {
      text: this.props.inquiryArtwork.contact_message,
      sending: false,
    }
  }

  dismissModal() {
    ARSwitchBoard.dismissModalViewController(this)
  }

  sendInquiry() {
    // Using setState to trigger re-render for the button
    this.setState(() => ({ sending: true }))
    const { Emission } = NativeModules
    fetch(gravityURL + "/api/v1/me/artwork_inquiry_request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ACCESS-TOKEN": Emission.authenticationToken,
      },
      body: JSON.stringify({
        artwork: this.props.inquiryArtwork.id,
        message: this.state.text,
      }),
    })
      .then(response => {
        if (response.status >= 200 && response.status < 300) {
          this.dismissModal()
        } else {
          this.setState(() => ({ sending: false }))
          const error = new NetworkError(response.statusText)
          error.response = response
          throw error
        }
      })
      .catch(error => {
        this.setState(() => ({ sending: false }))
        throw error
      })
  }

  render() {
    const message = this.state.text
    const partnerResponseRate = "2 DAY RESPONSE TIME" // currently hardcoded
    const inquiryArtwork = this.props.inquiryArtwork
    const partnerName = this.props.inquiryArtwork.partner.name
    const buttonText = this.state.sending ? "SENDING..." : "SEND"

    const doneButtonStyles = {
      backgroundColor: colors["purple-regular"],
      marginBottom: 0,
      paddingTop: 12,
      height: 44,
    }

    return (
      <Container>
        <StatusBar />
        <BottomAlignedButton
          onPress={this.sendInquiry.bind(this)}
          bodyStyle={doneButtonStyles}
          buttonText={buttonText}
          disabled={this.state.sending}
        >
          <Header>
            <HeaderTextContainer>
              <CancelButton onPress={this.dismissModal.bind(this)}>
                <MetadataText>CANCEL</MetadataText>
              </CancelButton>
              <TitleView>
                <SmallHeadline>
                  {partnerName}
                </SmallHeadline>
                <ResponseRateLine>
                  <ResponseIndicator />
                  <ResponseRate>
                    {partnerResponseRate}
                  </ResponseRate>
                </ResponseRateLine>
              </TitleView>
              <PlaceholderView>CANCEL</PlaceholderView>
            </HeaderTextContainer>
          </Header>
          <Content>
            <ArtworkPreview artwork={inquiryArtwork as any} />
            <InquiryTextInput
              value={message}
              keyboardAppearance="dark"
              multiline={true}
              autoFocus={true}
              onEndEditing={() => {
                this.setState({ active: false, text: null })
              }}
              onChangeText={text => this.setState({ text })}
            />
          </Content>
        </BottomAlignedButton>
      </Container>
    )
  }
}

export default Relay.createContainer(Inquiry, {
  fragments: {
    inquiryArtwork: () => Relay.QL`
      fragment on Artwork {
        id
        contact_message
        ${ArtworkPreview.getFragment("artwork")}
        partner {
          name
        }
      }
    `,
  },
})

interface RelayProps {
  inquiryArtwork: {
    id: string
    contact_message: string
    partner: {
      name: string
    }
  }
}
