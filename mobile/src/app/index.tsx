import dayjs from 'dayjs'
import { router } from 'expo-router'
import {
  ArrowRight,
  AtSign,
  Calendar as IconCalendar,
  MapPin,
  Settings2,
  UserRoundPlus,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Image, Keyboard, Text, View } from 'react-native'
import { DateData } from 'react-native-calendars'

import { Button } from '@/components/button'
import { Calendar } from '@/components/calendar'
import { GuestEmail } from '@/components/email'
import { Input } from '@/components/input'
import { LoadingIndicator } from '@/components/loading'
import { Modal } from '@/components/modal'
import { tripServer } from '@/server/trip-server'
import { tripStorage } from '@/storage/trip'
import { colors } from '@/styles/colors'
import { calendarUtils, DatesSelected } from '@/utils/calendarUtils'
import { validateInput } from '@/utils/validateInput'

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

export default function Index() {
  const [isCreatingTrip, setIsCreatingTrip] = useState(false)
  const [isGettingTrip, setIsGettingTrip] = useState(true)

  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS)
  const [showModal, setShowModal] = useState(MODAL.NONE)

  const [selectedDates, setSelectedDates] = useState({} as DatesSelected)
  const [destination, setDestination] = useState('')

  const [emailToInvite, setEmailToInvite] = useState('')
  const [emailsToInvite, setEmailsToInvite] = useState<string[]>([])

  function handleNextStepForm() {
    if (
      destination.trim().length === 0 ||
      !selectedDates.startsAt ||
      !selectedDates.endsAt
    ) {
      return Alert.alert(
        'Detalhes da viagem',
        'Preencha todas as informações da viagem para seguir.',
      )
    }

    if (destination.length < 4) {
      return Alert.alert(
        'Detalhes da viagem',
        'Destino deve possui pelo menos quatro(4) caracteres.',
      )
    }

    if (stepForm === StepForm.TRIP_DETAILS) {
      return setStepForm(StepForm.ADD_EMAIL)
    }

    Alert.alert('Nova viagem', 'Confirmar viagem?', [
      {
        text: 'Não',
        style: 'cancel',
      },
      {
        text: 'Sim',
        onPress: createTrip,
      },
    ])
  }

  function handleSelectedDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    })

    setSelectedDates(dates)
  }

  function handleRemoveEmail(emailToRemove: string) {
    setEmailsToInvite((prevSate) =>
      prevSate.filter((email) => email !== emailToRemove),
    )
  }

  function handleAddEmail() {
    if (!validateInput.email(emailToInvite)) {
      return Alert.alert('Convidado', 'Email inválido')
    }

    const emailAlreadyExists = emailsToInvite.find(
      (email) => email === emailToInvite,
    )
    if (emailAlreadyExists) {
      return Alert.alert('Convidado', 'Email já adicionado')
    }

    setEmailsToInvite((prevState) => [...prevState, emailToInvite])

    setEmailToInvite('')
  }

  async function saveTrip(tripId: string) {
    try {
      await tripStorage.save(tripId)
      router.navigate(`/trip/${tripId}`)
    } catch (error) {
      console.log(error)
      Alert.alert(
        'Salvar viagem',
        'Não foi possível salvar o id da viagem no dispositivo.',
      )
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true)

      const data = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emailsToInvite,
      })

      Alert.alert('Nova viagem', 'Viagem criada com sucesso!', [
        {
          text: 'Ok. Continuar...',
          onPress: () => saveTrip(data.tripId),
        },
      ])
    } catch (error) {
      console.log(error)
      setIsCreatingTrip(false)
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get()

      if (!tripId) {
        return setIsGettingTrip(false)
      }

      const trip = await tripServer.getById(tripId)

      if (trip) {
        return router.navigate(`/trip/${trip.id}`)
      }
    } catch (error) {
      setIsGettingTrip(false)
      console.log(error)
    }

    if (isGettingTrip) {
      return <LoadingIndicator />
    }
  }

  useEffect(() => {
    getTrip()
  }, [])

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        alt=""
        source={require('@/assets/logo.png')}
        className="h-8"
        resizeMode="contain"
      />

      <Image source={require('@/assets/bg.png')} className="absolute" />
      <Text className="mt-3 text-center font-regular text-lg text-zinc-400">
        Convide seus amigos e planeje sua{'\n'}proxima viagem
      </Text>

      <View className="my-8 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Para onde?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onChangeText={setDestination}
            value={destination}
          />
        </Input>

        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Quando?"
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }
            value={selectedDates.formatDatesInText}
          />
        </Input>

        {stepForm === StepForm.ADD_EMAIL && (
          <>
            <View className="border-b border-zinc-800 py-3">
              <Button
                variant="secondary"
                onPress={() => setStepForm(StepForm.TRIP_DETAILS)}
              >
                <Button.Title>Alterar local/Data</Button.Title>
                <Settings2 color={colors.zinc[200]} size={20} />
              </Button>
            </View>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field
                placeholder="Quem estará na viagem"
                autoCorrect={false}
                value={
                  emailsToInvite.length > 0
                    ? `${emailsToInvite.length} pessoas(a) convidadas`
                    : ''
                }
                onPress={() => {
                  Keyboard.dismiss()
                  setShowModal(MODAL.GUESTS)
                }}
                showSoftInputOnFocus={false}
              />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm} isLoading={isCreatingTrip}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS
              ? 'Continuar'
              : 'Confirmar viagem'}
          </Button.Title>
          <ArrowRight color={colors.lime[950]} size={20} />
        </Button>
      </View>

      <Text className="text-center font-regular text-base text-zinc-500">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com
        nossos{' '}
        <Text className="text-zinc-300 underline">
          termos de uso e políticas de privacidade.
        </Text>
      </Text>

      <Modal
        title="Selecionar datas"
        subtitle="Selecione a data de ida e volta da viagem"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="mt-4 gap-4">
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectedDate}
            markedDates={selectedDates.dates}
          />
          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <Button.Title>Confirmar</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Selecionar convidados"
        subtitle="Os convidados irão receber e-mails para confirmar a participação na viagem."
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="my-2 flex-wrap items-start gap-2 border-b border-zinc-800 py-5">
          {emailsToInvite.length > 0 ? (
            emailsToInvite.map((email, i) => (
              <GuestEmail
                key={i}
                email={email}
                onRemove={() => handleRemoveEmail(email)}
              />
            ))
          ) : (
            <Text className="font-regular text-base text-zinc-600">
              Nenhum email adicionado
            </Text>
          )}
        </View>

        <View className="mot-4 gap-4">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Digite o e-mail do convidado"
              keyboardType="email-address"
              onChangeText={(text) =>
                setEmailToInvite(text.toLowerCase().trim())
              }
              value={emailToInvite}
              returnKeyType="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>
          <Button onPress={handleAddEmail}>
            <Button.Title>Convidar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  )
}
